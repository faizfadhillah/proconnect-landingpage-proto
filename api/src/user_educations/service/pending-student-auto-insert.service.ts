import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, In } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { User } from "../../users/entities/user.entity";
import { PendingStudentVerification } from "../entities/pending_student_verification.entity";
import { PendingStudentVerificationsDao } from "../dao/pending_student_verifications.dao";
import { UserEducationsDao } from "../dao/user_educations.dao";
import { UserEducationsService } from "./user_educations.service";
import { EducationHelperService } from "./education-helper.service";
import { EducationVerificationService } from "./education-verification.service";
import { LoggingService } from "../../logs/logs.service";
import { ApprovalState } from "../../common/enums/approval-state.enum";
import { CreateUserEducationDto } from "../dto/create-user_education.dto";

/**
 * Service untuk auto-insert pending student verifications ke user_educations
 * Berjalan setiap 1 jam via cronjob dan bisa dipanggil manual saat export excel
 */
@Injectable()
export class PendingStudentAutoInsertService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly pendingStudentVerificationsDao: PendingStudentVerificationsDao,
    private readonly userEducationsDao: UserEducationsDao,
    private readonly userEducationsService: UserEducationsService,
    private readonly educationHelperService: EducationHelperService,
    private readonly educationVerificationService: EducationVerificationService,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Cron job yang berjalan setiap 1 jam
   * Auto-insert pending student verifications ke user_educations jika email match
   */
  @Cron("0 * * * *") // Every hour at minute 0
  async processPendingStudentVerifications() {
    this.logger.info(
      "Starting scheduled auto-insert of pending student verifications",
      "pending-student-auto-insert-cron",
    );

    try {
      const result = await this.autoInsertAllPendingVerifications();
      
      this.logger.info(
        `Scheduled auto-insert completed: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors} errors`,
        "pending-student-auto-insert-cron",
        { result },
      );
    } catch (error) {
      this.logger.error(
        `Scheduled auto-insert failed: ${error instanceof Error ? error.message : String(error)}`,
        "pending-student-auto-insert-cron",
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
    }
  }

  /**
   * Manual method untuk dipanggil saat export excel atau secara manual
   * Auto-insert semua pending student verifications yang email-nya match dengan user yang ada
   */
  async autoInsertAllPendingVerifications(): Promise<{
    inserted: number;
    skipped: number;
    errors: number;
  }> {
    const result = {
      inserted: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      // Get all pending verifications with email
      const allPending = await this.pendingStudentVerificationsDao.findAllPendingWithEmailNotNull();
      
      // Group by email for batch processing
      const pendingByEmail = new Map<string, PendingStudentVerification[]>();
      
      // Get all unique emails from pending verifications
      const emails = new Set<string>();
      for (const pending of allPending) {
        if (pending.email) {
          emails.add(pending.email);
          if (!pendingByEmail.has(pending.email)) {
            pendingByEmail.set(pending.email, []);
          }
          pendingByEmail.get(pending.email)!.push(pending);
        }
      }

      if (emails.size === 0) {
        this.logger.info(
          "No pending student verifications with email found",
          "pending-student-auto-insert",
        );
        return result;
      }

      // Find all users with matching emails
      const users = await this.userRepository.find({
        where: {
          email: In(Array.from(emails)),
          deleted_at: IsNull(),
        },
        select: ["id", "email"],
      });

      const userByEmail = new Map<string, User>();
      for (const user of users) {
        userByEmail.set(user.email.toLowerCase(), user);
      }

      // Process each email group
      for (const [email, pendingList] of pendingByEmail.entries()) {
        const user = userByEmail.get(email.toLowerCase());
        
        if (!user) {
          // No user found for this email, skip
          continue;
        }

        // Process each pending verification for this email
        for (const pending of pendingList) {
          try {
            const inserted = await this.processSinglePendingVerification(pending, user.id);
            if (inserted) {
              result.inserted++;
            } else {
              result.skipped++;
            }
          } catch (error) {
            result.errors++;
            this.logger.error(
              `Failed to process pending verification ${pending.id}: ${error instanceof Error ? error.message : String(error)}`,
              "pending-student-auto-insert",
              error instanceof Error ? error.stack : undefined,
              { pendingId: pending.id, userId: user.id, email },
            );
          }
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to auto-insert pending student verifications: ${error instanceof Error ? error.message : String(error)}`,
        "pending-student-auto-insert",
        error instanceof Error ? error.stack : undefined,
        { error: error instanceof Error ? error.message : String(error) },
      );
      throw error;
    }
  }

  /**
   * Process a single pending verification and insert to user_educations if conditions are met
   * @returns true if inserted, false if skipped
   */
  private async processSinglePendingVerification(
    pending: PendingStudentVerification,
    userId: string,
  ): Promise<boolean> {
    // Check if user education already exists for this student_id and school_id
    const existingEducation = await this.userEducationsDao.findByStudentAndSchool(
      pending.student_id,
      pending.school_id,
    );

    if (existingEducation) {
      // Already exists, delete pending and skip
      await this.pendingStudentVerificationsDao.softDeleteById(pending.id);
      this.logger.info(
        `Pending student verification ${pending.id} already exists in user_educations, deleted pending entry`,
        "pending-student-auto-insert",
        { pendingId: pending.id, userId },
      );
      return false;
    }

    // Fetch school name
    const school = await this.pendingStudentVerificationsDao.findSchoolById(pending.school_id);
    if (!school) {
      this.logger.warn(
        `School not found for pending verification ${pending.id}`,
        "pending-student-auto-insert",
        { pendingId: pending.id, schoolId: pending.school_id },
      );
      return false;
    }

    // Convert pending to CreateUserEducationDto
    const educationDto: CreateUserEducationDto = {
      user_id: userId,
      school_id: pending.school_id,
      education_degree: pending.degree,
      institution_name: school.name,
      major: pending.major || "",
      major_id: pending.major_id || undefined,
      student_id: pending.student_id,
      diploma_level: pending.diploma_level || undefined,
      is_outside_indo: false,
      other_country: null,
      other_region: null,
      start_date: new Date(), // Default date, user can update later
      is_current: false,
      file_url: undefined,
      certificate_number: undefined,
      curriculum_year: undefined,
    };

    // Create user education directly (without calling userEducationsService.create() to avoid infinite loop)
    const userEducation = await this.userEducationsDao.create(educationDto);
    userEducation.approval_state = ApprovalState.WAITING_APPROVAL;
    userEducation.approval_by = null;
    const savedEducation = await this.userEducationsDao.save(userEducation);

    await this.educationHelperService.updateIsSchoolVerifiedStatus(savedEducation);
    await this.educationHelperService.updateMajorId(savedEducation);

    // Create pending certificates with WAITING_APPROVAL for all matching mappings
    await this.educationVerificationService.createPendingCertificates(savedEducation);

    await this.educationVerificationService.autoApproveAndTriggerVerification(savedEducation);

    // Delete the pending verification after successful insertion
    await this.pendingStudentVerificationsDao.softDeleteById(pending.id);

    this.logger.info(
      `Auto-inserted pending student verification ${pending.id} to user_educations for user ${userId}`,
      "pending-student-auto-insert",
      { pendingId: pending.id, userId, email: pending.email },
    );

    return true;
  }
}
