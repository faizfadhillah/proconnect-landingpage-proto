// src\user_certificates\user_certificates.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEducation } from "../user_educations/entities/user_education.entity";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { CreateUserCertificateDto } from "./dto/create-user_certificates.dto";
import { UpdateUserCertificateDto } from "./dto/update-user_certificates.dto";
import { UserCertificate } from "./entities/user_certificates.entity";
import { MstLicense } from "../mst_licenses/entities/mst_license.entity";
import { MstLicenseSkillMappingsService } from "../mst_license_skill_mappings/mst_license_skill_mappings.service";
import { UserSkillsService } from "../user_skills/user_skills.service";
import { LoggingService } from "../logs/logs.service";
import { CERTIFICATE_VERIFICATION_QUEUE } from "../common/queues/queue.constants";
import { ApprovalState } from "../common/enums/approval-state.enum";
import { RetroactiveEducationLicenseQueuePublisher } from "../queues/publishers/retroactive-education-license-queue.publisher";
import { MstLicensesService } from "../mst_licenses/mst_licenses.service";
import { UserCertificateDao } from "./user_certificate.dao";

@Injectable()
export class UserCertificatesService {
  constructor(
    @InjectRepository(UserCertificate)
    private userCertificateRepository: Repository<UserCertificate>,
    @InjectRepository(UserEducation)
    private userEducationRepository: Repository<UserEducation>,
    private readonly dao: UserCertificateDao,
    private licenseSkillMappingService: MstLicenseSkillMappingsService,
    private userSkillsService: UserSkillsService,
    private readonly logger: LoggingService,
    @InjectQueue(CERTIFICATE_VERIFICATION_QUEUE)
    private readonly certificateVerificationQueue: Queue,
    private readonly retroactiveEducationLicenseQueuePublisher: RetroactiveEducationLicenseQueuePublisher,
    private readonly mstLicensesService: MstLicensesService,
  ) {}

  async create(
    createUserCertificateDto: CreateUserCertificateDto,
  ): Promise<UserCertificate> {
    // If mst_license_id provided, validate and populate from mst_license
    let mstLicense: MstLicense | null = null;
    if (createUserCertificateDto.mst_license_id) {
      mstLicense = await this.mstLicensesService.findOne(
        createUserCertificateDto.mst_license_id,
      );
    }

    // Create certificate entity using DTO method
    const userCertificate = this.userCertificateRepository.create(
      createUserCertificateDto.toEntity(mstLicense),
    );

    // Set default approval_state to WAITING_APPROVAL
    // Approval/rejection will be done via approval flow
    userCertificate.approval_state = ApprovalState.WAITING_APPROVAL;
    userCertificate.approval_by = null;

    const saved = await this.userCertificateRepository.save(userCertificate);

    // Trigger retroactive queue
    if (saved.mst_license_id) {
      await this.retroactiveEducationLicenseQueuePublisher.publishCertificateJob(
        saved.user_id,
        saved.mst_license_id,
      );
    }

    return saved;
  }

  async findOne(id: string): Promise<UserCertificate> {
    const userCertificate = await this.userCertificateRepository.findOne({
      where: { id },
    });
    if (!userCertificate) {
      throw new NotFoundException(`UserCertificate with ID ${id} not found`);
    }
    return userCertificate;
  }

  async update(
    id: string,
    updateUserCertificateDto: UpdateUserCertificateDto,
  ): Promise<UserCertificate> {
    const certificate = await this.findOne(id);

    // Only prevent edit if approval_state=APPROVED
    // All other states (WAITING_APPROVAL, REJECT, etc.) can be edited
    if (certificate.approval_state === ApprovalState.APPROVED) {
      throw new BadRequestException(
        `Cannot update UserCertificate with ID ${id} because approval_state is ${certificate.approval_state}. Only APPROVED records cannot be edited.`,
      );
    }

    // Defensive: ignore is_verified, approval fields, and license-related fields if somehow provided
    const {
      is_verified,
      approval_state,
      approval_by,
      license_number,
      license_name,
      issuing_organization,
      issue_date,
      mst_license_id,
      ...updateData
    } = updateUserCertificateDto as any;

    Object.assign(certificate, updateData);
    return await this.userCertificateRepository.save(certificate);
  }

  async remove(id: string): Promise<void> {
    const certificate = await this.findOne(id);

    // Check if certificate is linked to an active user education
    if (certificate.user_education_id) {
      // Check if user education exists and is not deleted
      const userEducation = await this.userEducationRepository.findOne({
        where: { id: certificate.user_education_id },
      });

      if (userEducation && !userEducation.deleted_at) {
        throw new BadRequestException(
          `Cannot delete certificate with ID ${id} because it is linked to an active user education (ID: ${certificate.user_education_id}). Please delete the education first.`,
        );
      }
    }

    const result = await this.userCertificateRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserCertificate with ID ${id} not found`);
    }
  }

  /**
   * Grant verified license to user
   * Used by: Education verification, Informal certificates, Retroactive processing
   * This method is centralized to avoid code duplication
   */
  async grantVerifiedLicense(
    userId: string,
    licenseId: string,
    license: MstLicense,
    description: string = "Granted via automated verification",
    userEducationId?: string,
  ): Promise<void> {
    this.logger.log(
      `Granting verified license to user ${userId} with license ${licenseId} and user education id ${userEducationId} | Description: ${description}`,
      "grant_verified_license",
      { userId, licenseId, userEducationId },
    );

    // Find all existing certificates for this user+license (multiple certificates per user+license is allowed)
    let existingCerts = await this.dao.findAllByUserAndLicense(
      userId,
      licenseId,
    );
    if (userEducationId) {
      existingCerts = existingCerts.filter(
        (cert) => cert.user_education_id === userEducationId,
      );
    }

    if (existingCerts.length > 0) {
      // Loop through all certificates and approve those that match criteria
      for (const cert of existingCerts) {
        if (cert.approval_state === ApprovalState.APPROVED) {
          continue;
        }

        if (userEducationId && !cert.user_education_id) {
          this.logger.log(
            `Updating user certificate ${cert.id} with user education id ${userEducationId}`,
            "grant_verified_license",
            { certificateId: cert.id, userEducationId },
          );
          cert.user_education_id = userEducationId;
        }

        await this.approveCertificateIfNeeded(cert);
      }
      return;
    }

    // No existing certificate found - create new certificate with APPROVED
    await this.createAndApproveCertificate(
      userId,
      licenseId,
      license,
      userEducationId,
    );
  }

  /**
   * Approve certificate if it's not already APPROVED
   */
  private async approveCertificateIfNeeded(
    certificate: UserCertificate,
  ): Promise<void> {
    if (certificate.approval_state === ApprovalState.APPROVED) {
      return;
    }
    await this.saveAndApproveUserCertificate(certificate);
  }

  /**
   * Create new certificate and approve it
   */
  private async createAndApproveCertificate(
    userId: string,
    licenseId: string,
    license: MstLicense,
    userEducationId?: string,
  ): Promise<void> {
    const dto = new CreateUserCertificateDto();
    dto.user_id = userId;
    dto.mst_license_id = licenseId;
    dto.user_education_id = userEducationId || null;
    dto.certificate_level = license.certificate_level || null;
    dto.no_expiry = true;

    const newCert = await this.create(dto);
    await this.saveAndApproveUserCertificate(newCert);
  }

  private async saveAndApproveUserCertificate(
    userCertificate: UserCertificate,
  ): Promise<void> {
    this.logger.log(
      `Saved and approved user certificate ${userCertificate.id}`,
      "save_and_approve_user_certificate",
      { userCertificateId: userCertificate.id },
    );
    userCertificate.approval_state = ApprovalState.APPROVED;
    userCertificate.approval_by = "system";
    userCertificate.is_verified = true;
    await this.userCertificateRepository.save(userCertificate);

    // Trigger certificate verification queue
    await this.triggerCertificateVerificationQueue(
      userCertificate.id,
      userCertificate.mst_license_id,
    );
  }

  private async triggerCertificateVerificationQueue(
    certificateId: string,
    licenseId: string,
  ): Promise<void> {
    if (!licenseId) {
      this.logger.warn(
        `Cannot trigger certificate verification queue because licenseId is not provided | Certificate ID: ${certificateId}`,
        "trigger_certificate_verification_queue",
        { certificateId: certificateId },
      );
      return;
    }

    this.logger.log(
      `Triggering certificate verification queue for certificate ${certificateId} with license ${licenseId}`,
      "trigger_certificate_verification_queue",
      { certificateId: certificateId, licenseId: licenseId },
    );
    this.certificateVerificationQueue.add(CERTIFICATE_VERIFICATION_QUEUE, {
      certificateId: certificateId,
    });
  }

  /**
   * Process certificate verification - find matching skills and grant them
   * Called automatically when certificate is verified
   */
  async processCertificateVerification(
    certificate: UserCertificate,
  ): Promise<void> {
    // Only process if approval_state=APPROVED
    if (certificate.approval_state !== ApprovalState.APPROVED) {
      this.logger.warn(
        "Certificate is not approved, skipping verification processing",
        "certificate_verification",
        {
          certificateId: certificate.id,
          userId: certificate.user_id,
          approval_state: certificate.approval_state,
        },
      );
      return;
    }

    if (!certificate.mst_license_id) {
      this.logger.log(
        "Certificate has no mst_license_id, skipping skill granting",
        "certificate_verification",
        { certificateId: certificate.id, userId: certificate.user_id },
      );
      return;
    }

    // 1. Find license-skill mappings
    const mappings = await this.licenseSkillMappingService.findByLicenseId(
      certificate.mst_license_id,
    );

    if (mappings.length === 0) {
      this.logger.log(
        "No skill mappings found for this license",
        "certificate_verification",
        {
          certificateId: certificate.id,
          userId: certificate.user_id,
          licenseId: certificate.mst_license_id,
        },
      );
      return;
    }

    // 2. For each mapping, upsert user_skill
    for (const mapping of mappings) {
      try {
        await this.userSkillsService.grantVerifiedSkill(
          certificate.user_id,
          mapping.skill_id,
        );
      } catch (error) {
        this.logger.error(
          `Error granting skill ${mapping.skill_id} to user ${certificate.user_id}`,
          "certificate_verification",
          error?.stack || error?.message || String(error),
          {
            error: error?.message || String(error),
            skillId: mapping.skill_id,
            userId: certificate.user_id,
            certificateId: certificate.id,
            licenseId: certificate.mst_license_id,
          },
        );
      }
    }
  }

  /**
   * Helper: process certificate verification by ID (used by queue processor)
   */
  async processCertificateVerificationById(
    certificateId: string,
  ): Promise<void> {
    const certificate = await this.findOne(certificateId);
    await this.processCertificateVerification(certificate);
  }

  /**
   * Find all certificates for multiple users in one query
   * Returns certificates grouped by user_id for efficient lookup
   * @param userIds Array of user IDs
   * @returns Map of user_id -> UserCertificate[]
   */
  async findByUserIds(
    userIds: string[],
  ): Promise<Map<string, UserCertificate[]>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const certificates = await this.dao.findByUserIds(userIds);

    // Group by user_id
    const grouped = new Map<string, UserCertificate[]>();
    for (const cert of certificates) {
      const existing = grouped.get(cert.user_id) || [];
      existing.push(cert);
      grouped.set(cert.user_id, existing);
    }

    return grouped;
  }

  /**
   * Find all certificates for multiple users in one query
   * Returns certificates grouped by user_id for efficient lookup
   * @param userIds Array of user IDs
   * @returns Map of user_id -> UserCertificate[]
   */
  async findByUserIdsWithEducation(
    userIds: string[],
  ): Promise<Map<string, UserCertificate[]>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const certificates = await this.dao.findByUserIdsWithEducation(userIds);

    // Group by user_id
    const grouped = new Map<string, UserCertificate[]>();
    for (const cert of certificates) {
      const existing = grouped.get(cert.user_id) || [];
      existing.push(cert);
      grouped.set(cert.user_id, existing);
    }

    return grouped;
  }
}
