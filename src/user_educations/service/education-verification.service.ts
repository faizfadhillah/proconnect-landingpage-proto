import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { UserEducation } from "../entities/user_education.entity";
import {
  ApprovalState,
  isFinalApprovalState,
} from "../../common/enums/approval-state.enum";
import { EDUCATION_VERIFICATION_QUEUE } from "../../common/queues/queue.constants";
import { RequestContextService } from "../../common/request-context/request-context.service";
import { MstLicense } from "../../mst_licenses/entities/mst_license.entity";
import { UserEducationsDao } from "../dao/user_educations.dao";
import { PendingStudentVerificationsService } from "./pending_student_verifications.service";
import { MstEducationLicenseMappingsService } from "../../mst_education_license_mappings/mst_education_license_mappings.service";
import { UserCertificatesService } from "../../user_certificates/user_certificates.service";
import { CreateUserCertificateDto } from "../../user_certificates/dto/create-user_certificates.dto";
import { LoggingService } from "../../logs/logs.service";
import { UserCertificateDao } from "src/user_certificates/user_certificate.dao";
import { UserSkillsService } from "../../user_skills/user_skills.service";
import { MstLicenseSkillMappingsService } from "../../mst_license_skill_mappings/mst_license_skill_mappings.service";
import { MstLicenseSkillMappingDao } from "../../mst_license_skill_mappings/dao/mst_license_skill_mapping.dao";

@Injectable()
export class EducationVerificationService {
  constructor(
    private readonly userEducationsDao: UserEducationsDao,
    private readonly pendingStudentVerificationsService: PendingStudentVerificationsService,
    private readonly educationLicenseMappingService: MstEducationLicenseMappingsService,
    private readonly userCertificatesService: UserCertificatesService,
    private readonly userCertificateDao: UserCertificateDao,
    private readonly userSkillsService: UserSkillsService,
    private readonly mstLicenseSkillMappingsService: MstLicenseSkillMappingsService,
    private readonly mstLicenseSkillMappingDao: MstLicenseSkillMappingDao,
    private readonly logger: LoggingService,
    @InjectQueue(EDUCATION_VERIFICATION_QUEUE)
    private readonly educationVerificationQueue: Queue,
    private readonly requestContextService: RequestContextService,
  ) {}

  /**
   * Approve or reject education verification (Admin only)
   */
  async approve(
    id: string,
    approvalState: ApprovalState,
    approvalBy: string,
  ): Promise<UserEducation> {
    // Additional defense: prevent candidates from accessing this method
    // Skip check if no currentUserId (internal/system call from queue)
    if (
      this.requestContextService.getCurrentUserId() &&
      this.requestContextService.getCurrentUserIsCandidate()
    ) {
      throw new ForbiddenException(
        "Candidates cannot approve/reject verification",
      );
    }

    const userEducation = await this.userEducationsDao.findById(id, ["school"]);
    if (!userEducation) {
      throw new NotFoundException(`UserEducation with ID ${id} not found`);
    }

    // Validate: allow changes between APPROVED and REJECT (unverify/verify)
    // Only prevent if trying to change to the same state
    if (userEducation.approval_state === approvalState) {
      throw new BadRequestException(
        `UserEducation with ID ${id} is already in state: ${approvalState}`,
      );
    }

    // Allow transitions:
    // - WAITING_APPROVAL -> APPROVED (verify)
    // - WAITING_APPROVAL -> REJECT (reject)
    // - APPROVED -> REJECT (unverify)
    // - REJECT -> APPROVED (re-verify)
    const previousState = userEducation.approval_state;
    userEducation.approval_state = approvalState;
    userEducation.approval_by = approvalBy;

    // Also update is_verified for FE,
    // FE use this field to check if the education is verified
    userEducation.is_verified = approvalState === ApprovalState.APPROVED;

    const updated = await this.userEducationsDao.save(userEducation);

    // Trigger queue if changing to APPROVED (from WAITING_APPROVAL or REJECT)
    if (
      approvalState === ApprovalState.APPROVED &&
      previousState !== ApprovalState.APPROVED
    ) {
      await this.educationVerificationQueue.add(EDUCATION_VERIFICATION_QUEUE, {
        educationId: updated.id,
      });
    }

    // If unverifying (APPROVED -> REJECT), revoke licenses and skills
    if (
      approvalState === ApprovalState.REJECT &&
      previousState === ApprovalState.APPROVED
    ) {
      await this.revokeCertificatesAndSkillsByEducationId(
        updated.id,
        approvalBy,
      );
    }

    return updated;
  }

  /**
   * Process education verification - find matching licenses and grant them
   * Called automatically when education is verified
   * Accepts education entity directly
   */
  async processEducationVerification(education: UserEducation): Promise<void> {
    // Only process if approval_state=APPROVED
    if (education.approval_state !== ApprovalState.APPROVED) {
      this.logger.warn(
        "Education is not approved, skipping verification processing",
        "education_verification",
        {
          educationId: education.id,
          userId: education.user_id,
          approval_state: education.approval_state,
        },
      );
      return;
    }

    // Validate required fields (diploma_level optional; mappings can have diploma_level NULL)
    if (
      !education.school_id ||
      !education.major_id ||
      !education.education_degree
    ) {
      this.logger.warn(
        "Education missing required fields for license mapping",
        "education_verification",
        { educationId: education.id, userId: education.user_id },
      );
      return;
    }

    // 1. Find matching education-license mappings
    const mappings =
      await this.educationLicenseMappingService.findByEducation(education);
    if (mappings.length === 0) {
      this.logger.log(
        "No license mappings found for this education",
        "education_verification",
        {
          educationId: education.id,
          userId: education.user_id,
          school_id: education.school_id,
          major_id: education.major_id,
          degree: education.education_degree,
          diploma_level: education.diploma_level,
        },
      );
      return;
    }

    // 2. For each mapping, grant license (update existing or create new)
    for (const mapping of mappings) {
      try {
        await this.userCertificatesService.grantVerifiedLicense(
          education.user_id,
          mapping.license_id,
          mapping.license,
          "Granted via verified education",
          education.id,
        );
      } catch (error) {
        this.logger.error(
          `Error granting license ${mapping.license_id} to user ${education.user_id}`,
          "education_verification",
          error?.stack || error?.message || String(error),
          {
            error: error?.message || String(error),
            licenseId: mapping.license_id,
            userId: education.user_id,
            educationId: education.id,
          },
        );
        // Continue with other mappings
      }
    }
  }

  /**
   * Helper: process education verification by ID (used by queue processor)
   */
  async processEducationVerificationById(educationId: string): Promise<void> {
    const education = await this.userEducationsDao.findById(educationId, [
      "school",
    ]);

    if (!education) {
      throw new NotFoundException(`Education with ID ${educationId} not found`);
    }

    await this.processEducationVerification(education);
  }

  /**
   * Create pending certificates with WAITING_APPROVAL for all matching mappings
   * Called when user education is created
   */
  async createPendingCertificates(userEducation: UserEducation): Promise<void> {
    // Validate required fields (diploma_level optional; mappings can have diploma_level NULL)
    if (
      !userEducation.school_id ||
      !userEducation.major_id ||
      !userEducation.education_degree
    ) {
      this.logger.warn(
        "Cannot create pending certificates: missing required fields",
        "create_pending_certificates",
        { userEducationId: userEducation.id },
      );
      return;
    }

    // Find all matching education-license mappings
    const mappings =
      await this.educationLicenseMappingService.findByEducation(userEducation);
    if (mappings.length === 0) {
      this.logger.log(
        "No license mappings found for this education, skipping certificate creation",
        "create_pending_certificates",
        {
          educationId: userEducation.id,
          userId: userEducation.user_id,
        },
      );
      return;
    }

    // For each mapping, create certificate with WAITING_APPROVAL
    for (const mapping of mappings) {
      try {
        // Check if certificate already exists
        const existingCert =
          await this.userCertificateDao.findByUserLicenseAndEducation(
            userEducation.user_id,
            mapping.license_id,
            userEducation.id,
          );

        if (existingCert) {
          // Certificate already exists, skip
          continue;
        }

        // Create new certificate with WAITING_APPROVAL
        const dto = new CreateUserCertificateDto();
        dto.user_id = userEducation.user_id;
        dto.mst_license_id = mapping.license_id;
        dto.user_education_id = userEducation.id;
        dto.certificate_level = mapping.license.certificate_level || null;
        dto.no_expiry = true;
        dto.file_url = "";

        await this.userCertificatesService.create(dto);
      } catch (error) {
        this.logger.error(
          `Error creating pending certificate for license ${mapping.license_id} and education ${userEducation.id}`,
          "create_pending_certificates",
          error?.stack || error?.message || String(error),
          {
            error: error?.message || String(error),
            licenseId: mapping.license_id,
            userId: userEducation.user_id,
            educationId: userEducation.id,
          },
        );
      }
    }
  }

  /**
   * Auto-approve and trigger verification if matching pending entry exists
   */
  async autoApproveAndTriggerVerification(
    userEducation: UserEducation,
  ): Promise<void> {
    if (
      !userEducation.student_id ||
      !userEducation.school_id ||
      !userEducation.major_id ||
      !userEducation.education_degree
    ) {
      this.logger.warn(
        "Cannot auto-approve and trigger verification: missing required fields",
        "auto_approve_and_trigger_verification",
        { userEducationId: userEducation.id },
      );
      return;
    }

    const pendingEntry =
      await this.pendingStudentVerificationsService.findOneByStudentSchoolMajorDegreeDiploma(
        userEducation.student_id,
        userEducation.school_id,
        userEducation.major_id,
        userEducation.education_degree,
        userEducation.diploma_level,
      );

    if (pendingEntry) {
      userEducation.approval_state = ApprovalState.APPROVED;
      userEducation.approval_by = "system";
      userEducation.is_verified = true;
      userEducation = await this.userEducationsDao.save(userEducation);

      await this.educationVerificationQueue.add(EDUCATION_VERIFICATION_QUEUE, {
        educationId: userEducation.id,
      });

      // Delete the specific pending entry by ID
      await this.pendingStudentVerificationsService.remove(pendingEntry.id);
    }
  }

  /**
   * Delete all certificates linked to a user education
   */
  async deleteCertificatesByEducationId(
    userEducationId: string,
  ): Promise<void> {
    const certificates =
      await this.userCertificateDao.findByUserEducationId(userEducationId);
    for (const cert of certificates) {
      await this.userCertificateDao.softDelete(cert.id);
    }
  }

  /**
   * Revoke certificates and skills when education is unverified
   * Called when education approval_state changes from APPROVED to REJECT
   */
  async revokeCertificatesAndSkillsByEducationId(
    userEducationId: string,
    approvalBy: string,
  ): Promise<void> {
    this.logger.log(
      `Revoking certificates and skills for education ${userEducationId}`,
      "revoke_certificates_and_skills",
      { userEducationId, approvalBy },
    );

    // 1. Find all certificates linked to this education
    const certificates =
      await this.userCertificateDao.findByUserEducationId(userEducationId);

    if (certificates.length === 0) {
      this.logger.log(
        `No certificates found for education ${userEducationId}`,
        "revoke_certificates_and_skills",
        { userEducationId },
      );
      return;
    }

    // 2. Collect unique license IDs from certificates
    const licenseIds = new Set<string>();
    for (const cert of certificates) {
      if (cert.mst_license_id) {
        licenseIds.add(cert.mst_license_id);
      }
    }

    // 3. Find all license-skill mappings for these licenses
    const licenseSkillMappings =
      licenseIds.size > 0
        ? await this.mstLicenseSkillMappingDao.findByLicenseIds(
            Array.from(licenseIds),
          )
        : [];

    // Build map: license_id -> skill_ids[]
    const skillsByLicenseId = new Map<string, string[]>();
    for (const mapping of licenseSkillMappings) {
      const existing = skillsByLicenseId.get(mapping.license_id) || [];
      existing.push(mapping.skill_id);
      skillsByLicenseId.set(mapping.license_id, existing);
    }

    // 4. Revoke all certificates
    for (const cert of certificates) {
      try {
        // Only revoke if currently APPROVED
        if (cert.approval_state === ApprovalState.APPROVED) {
          cert.approval_state = ApprovalState.REJECT;
          cert.approval_by = approvalBy;
          cert.is_verified = false;
          await this.userCertificateDao.save(cert);

          this.logger.log(
            `Revoked certificate ${cert.id} for education ${userEducationId}`,
            "revoke_certificates_and_skills",
            { certificateId: cert.id, userEducationId },
          );

          // 5. Revoke skills associated with this certificate's license
          if (cert.mst_license_id && cert.user_id) {
            const skillIds = skillsByLicenseId.get(cert.mst_license_id) || [];
            for (const skillId of skillIds) {
              try {
                const revokedSkill =
                  await this.userSkillsService.revokeVerifiedSkill(
                    cert.user_id,
                    skillId,
                    approvalBy,
                  );

                if (revokedSkill) {
                  this.logger.log(
                    `Revoked skill ${skillId} for user ${cert.user_id} (via education ${userEducationId})`,
                    "revoke_certificates_and_skills",
                    {
                      skillId,
                      userId: cert.user_id,
                      userEducationId,
                    },
                  );
                }
              } catch (error) {
                this.logger.error(
                  `Error revoking skill ${skillId} for user ${cert.user_id}`,
                  "revoke_certificates_and_skills",
                  error?.stack || error?.message || String(error),
                  {
                    error: error?.message || String(error),
                    skillId,
                    userId: cert.user_id,
                    userEducationId,
                  },
                );
                // Continue with other skills
              }
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Error revoking certificate ${cert.id}`,
          "revoke_certificates_and_skills",
          error?.stack || error?.message || String(error),
          {
            error: error?.message || String(error),
            certificateId: cert.id,
            userEducationId,
          },
        );
        // Continue with other certificates
      }
    }
  }
}
