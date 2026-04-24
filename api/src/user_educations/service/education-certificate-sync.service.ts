import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, Not } from "typeorm";
import { Cron } from "@nestjs/schedule";
import { UserEducation } from "../entities/user_education.entity";
import { PendingStudentVerification } from "../entities/pending_student_verification.entity";
import { UserEducationsDao } from "../dao/user_educations.dao";
import { PendingStudentVerificationsDao } from "../dao/pending_student_verifications.dao";
import { EducationVerificationService } from "./education-verification.service";
import { EducationHelperService } from "./education-helper.service";
import { LoggingService } from "../../logs/logs.service";

/**
 * Service untuk sync certificates untuk user educations yang sudah memiliki
 * school_id, major_id, education_degree, dan diploma_level tapi belum memiliki certificates
 * Berjalan setiap 1 jam via cronjob
 */
@Injectable()
export class EducationCertificateSyncService {
  constructor(
    @InjectRepository(UserEducation)
    private readonly userEducationRepository: Repository<UserEducation>,
    @InjectRepository(PendingStudentVerification)
    private readonly pendingStudentVerificationRepository: Repository<PendingStudentVerification>,
    private readonly userEducationsDao: UserEducationsDao,
    private readonly pendingStudentVerificationsDao: PendingStudentVerificationsDao,
    private readonly educationVerificationService: EducationVerificationService,
    private readonly educationHelperService: EducationHelperService,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Cron job yang berjalan setiap 1 x Sehari
   * Sync certificates untuk educations yang memenuhi kriteria tapi belum memiliki certificates
   * Juga sync data dari pending students ke user educations jika school_id & student_id match
   */
  @Cron("0 0 * * *") // Every day at midnight
  async syncEducationCertificates() {
    this.logger.info(
      "Starting scheduled sync of education certificates and pending student data",
      "education-certificate-sync-cron",
    );

    try {
      // First, sync data from pending students to user educations
      const syncResult = await this.syncPendingStudentDataToEducations();
      
      // Then, sync certificates
      const certResult = await this.syncAllEducationCertificates();
      
      this.logger.info(
        `Scheduled sync completed: ${syncResult.updated} educations updated from pending, ${certResult.processed} processed for certificates, ${certResult.created} certificates created, ${certResult.skipped} skipped, ${certResult.errors + syncResult.errors} errors`,
        "education-certificate-sync-cron",
        { syncResult, certResult },
      );
    } catch (error) {
      this.logger.error(
        `Scheduled education certificate sync failed: ${error instanceof Error ? error.message : String(error)}`,
        "education-certificate-sync-cron",
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
    }
  }

  /**
   * Manual method untuk sync semua education certificates
   * Bisa dipanggil secara manual jika diperlukan
   */
  async syncAllEducationCertificates(): Promise<{
    processed: number;
    created: number;
    skipped: number;
    errors: number;
  }> {
    const result = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      // Find all user educations that have required fields for certificate mapping
      // school_id, major_id, education_degree required; diploma_level optional (mappings can have diploma_level NULL)
      const educations = await this.userEducationRepository.find({
        where: {
          school_id: Not(IsNull()),
          major_id: Not(IsNull()),
          education_degree: Not(IsNull()),
          deleted_at: IsNull(),
        },
        select: [
          "id",
          "user_id",
          "school_id",
          "major_id",
          "education_degree",
          "diploma_level",
        ],
      });

      this.logger.info(
        `Found ${educations.length} educations with all required fields for certificate mapping`,
        "education-certificate-sync",
        { totalEducations: educations.length },
      );

      // Process each education
      for (const education of educations) {
        try {
          result.processed++;

          // Load full education entity with relations if needed
          const fullEducation = await this.userEducationsDao.findById(education.id, [
            "school",
            "majorEntity",
          ]);

          if (!fullEducation) {
            result.skipped++;
            continue;
          }

          // Check if there are education-license mappings for this education
          // This will be checked inside createPendingCertificates
          // But we can optimize by checking first if certificates already exist
          
          // Call createPendingCertificates which will:
          // 1. Check if mappings exist
          // 2. Check if certificates already exist
          // 3. Create missing certificates
          await this.educationVerificationService.createPendingCertificates(fullEducation);

          // Note: createPendingCertificates doesn't return count, so we'll estimate
          // by checking if it completed without error
          result.created++; // Approximate - actual count would require modifying createPendingCertificates

          this.logger.debug(
            `Processed education ${education.id} for certificate sync`,
            "education-certificate-sync",
            {
              educationId: education.id,
              userId: education.user_id,
              schoolId: education.school_id,
              majorId: education.major_id,
              degree: education.education_degree,
              diplomaLevel: education.diploma_level,
            },
          );
        } catch (error) {
          result.errors++;
          this.logger.error(
            `Failed to sync certificates for education ${education.id}: ${error instanceof Error ? error.message : String(error)}`,
            "education-certificate-sync",
            error instanceof Error ? error.stack : undefined,
            {
              educationId: education.id,
              userId: education.user_id,
              error: error instanceof Error ? error.message : String(error),
            },
          );
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to sync education certificates: ${error instanceof Error ? error.message : String(error)}`,
        "education-certificate-sync",
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
      throw error;
    }
  }

  /**
   * Sync certificates for a specific education (manual trigger)
   */
  async syncEducationCertificatesById(educationId: string): Promise<void> {
    try {
      const education = await this.userEducationsDao.findById(educationId, [
        "school",
        "majorEntity",
      ]);

      if (!education) {
        throw new Error(`Education with ID ${educationId} not found`);
      }

      // Validate required fields (diploma_level optional; mappings can have diploma_level NULL)
      if (
        !education.school_id ||
        !education.major_id ||
        !education.education_degree
      ) {
        this.logger.warn(
          `Cannot sync certificates for education ${educationId}: missing required fields`,
          "education-certificate-sync",
          {
            educationId,
            hasSchoolId: !!education.school_id,
            hasMajorId: !!education.major_id,
            hasDegree: !!education.education_degree,
          },
        );
        return;
      }

      await this.educationVerificationService.createPendingCertificates(education);

      this.logger.info(
        `Successfully synced certificates for education ${educationId}`,
        "education-certificate-sync",
        { educationId },
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync certificates for education ${educationId}: ${error instanceof Error ? error.message : String(error)}`,
        "education-certificate-sync",
        error instanceof Error ? error.stack : undefined,
        { educationId, error: error instanceof Error ? error.message : String(error) },
      );
      throw error;
    }
  }

  /**
   * Sync data from pending student verifications to user educations
   * If school_id & student_id match, overwrite user education attributes with pending student data
   */
  async syncPendingStudentDataToEducations(): Promise<{
    updated: number;
    skipped: number;
    errors: number;
  }> {
    const result = {
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      // Get all pending student verifications
      const pendingVerifications = await this.pendingStudentVerificationRepository.find({
        where: {
          deleted_at: IsNull(),
        },
        select: [
          "id",
          "student_id",
          "school_id",
          "major_id",
          "degree",
          "diploma_level",
          "major",
        ],
      });

      this.logger.info(
        `Found ${pendingVerifications.length} pending student verifications to sync`,
        "sync-pending-student-data",
        { totalPending: pendingVerifications.length },
      );

      // Process each pending verification
      for (const pending of pendingVerifications) {
        try {
          // Find user education with matching school_id and student_id
          const education = await this.userEducationsDao.findByStudentAndSchool(
            pending.student_id,
            pending.school_id,
          );

          if (!education) {
            // No matching education found, skip
            result.skipped++;
            continue;
          }

          // Load full education entity
          const fullEducation = await this.userEducationsDao.findById(education.id, []);

          if (!fullEducation) {
            result.skipped++;
            continue;
          }

          // Track if any changes were made
          let hasChanges = false;

          // Overwrite attributes from pending student verification
          // Only update if pending has the value and it's different
          if (pending.major_id && pending.major_id !== fullEducation.major_id) {
            fullEducation.major_id = pending.major_id;
            hasChanges = true;
          }

          if (pending.degree && pending.degree !== fullEducation.education_degree) {
            fullEducation.education_degree = pending.degree;
            hasChanges = true;
          }

          if (
            pending.diploma_level !== null &&
            pending.diploma_level !== undefined &&
            pending.diploma_level !== fullEducation.diploma_level
          ) {
            fullEducation.diploma_level = pending.diploma_level;
            hasChanges = true;
          }

          if (pending.major && pending.major !== fullEducation.major) {
            fullEducation.major = pending.major;
            hasChanges = true;
          }

          // Only save if there are changes
          if (hasChanges) {
            // Save the updated education
            const updatedEducation = await this.userEducationsDao.save(fullEducation);

            // Update helper fields (is_school_verified, major_id resolution)
            await this.educationHelperService.updateIsSchoolVerifiedStatus(updatedEducation);
            await this.educationHelperService.updateMajorId(updatedEducation);

            result.updated++;

            this.logger.info(
              `Updated user education ${education.id} with data from pending student verification ${pending.id}`,
              "sync-pending-student-data",
              {
                educationId: education.id,
                pendingId: pending.id,
                studentId: pending.student_id,
                schoolId: pending.school_id,
                changes: {
                  major_id: pending.major_id !== education.major_id,
                  degree: pending.degree !== education.education_degree,
                  diploma_level: pending.diploma_level !== education.diploma_level,
                  major: pending.major !== education.major,
                },
              },
            );
          } else {
            result.skipped++;
          }
        } catch (error) {
          result.errors++;
          this.logger.error(
            `Failed to sync pending student verification ${pending.id} to user education: ${error instanceof Error ? error.message : String(error)}`,
            "sync-pending-student-data",
            error instanceof Error ? error.stack : undefined,
            {
              pendingId: pending.id,
              studentId: pending.student_id,
              schoolId: pending.school_id,
              error: error instanceof Error ? error.message : String(error),
            },
          );
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to sync pending student data to educations: ${error instanceof Error ? error.message : String(error)}`,
        "sync-pending-student-data",
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
      throw error;
    }
  }
}
