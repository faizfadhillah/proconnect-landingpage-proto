import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import * as ExcelJS from "exceljs";
import { PendingStudentVerification } from "../entities/pending_student_verification.entity";
import { UserEducation } from "../entities/user_education.entity";
import { User } from "src/users/entities/user.entity";
import { CreatePendingStudentVerificationDto } from "../dto/create-pending_student_verification.dto";
import { UpdatePendingStudentVerificationDto } from "../dto/update-pending_student_verification.dto";
import { PendingStudentVerificationsDao } from "../dao/pending_student_verifications.dao";
import { ApprovalState } from "../../common/enums/approval-state.enum";
import { LoggingService } from "src/logs/logs.service";
import { MstMajor } from "src/mst_majors/entities/mst_major.entity";
import { ConfigsService } from "src/config/config.service";
import { EducationHelperService } from "./education-helper.service";
import { UserEducationsService } from "./user_educations.service";
import { CreateUserEducationDto } from "../dto/create-user_education.dto";

@Injectable()
export class PendingStudentVerificationsService {
  constructor(
    private readonly dao: PendingStudentVerificationsDao,
    private readonly logger: LoggingService,
    @InjectRepository(MstMajor)
    private readonly majorRepository: Repository<MstMajor>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigsService,
    private readonly educationHelperService: EducationHelperService,
    @Inject(forwardRef(() => UserEducationsService))
    private readonly userEducationsService: UserEducationsService,
  ) { }

  async create(
    dto: CreatePendingStudentVerificationDto,
  ): Promise<PendingStudentVerification> {
    // Validate and resolve input
    const validated = await this.validateAndResolveInput(dto);



    // Check for duplicate pending entry with same student_id, school_id, major_id, degree, and diploma_level
    const existing = await this.dao.findPendingByStudentSchoolMajorDegreeDiploma(
      validated.student_id,
      validated.school_id,
      validated.major_id,
      validated.degree,
      validated.diploma_level || null,
    );
    if (existing) {
      throw new BadRequestException(
        "Pending student verification already exists for this student, school, major, degree, and diploma level",
      );
    }

    try {
      const entity = this.dao.createPending(dto, validated.major_id);
      const savedPending = await this.dao.savePending(entity);

      // Trigger sync if user with this email exists (Case 2: user already joined)
      if (dto.email) {
        try {
          const user = await this.userRepository.findOne({
            where: { 
              email: dto.email.trim().toLowerCase(),
              deleted_at: IsNull(),
            },
          });

          if (user) {
            // User exists (JOINED), trigger sync immediately
            this.logger.info(
              `User found for pending student ${savedPending.id}, triggering sync`,
              "pending-student-verifications",
              {
                pendingId: savedPending.id,
                userEmail: dto.email,
                userId: user.id,
              },
            );

            // Trigger sync asynchronously (don't wait for it to complete)
            this.syncPendingStudentsToUserEducations(dto.email.trim().toLowerCase(), user.id)
              .then((result) => {
                this.logger.info(
                  `Sync completed for pending student ${savedPending.id}`,
                  "pending-student-verifications",
                  {
                    pendingId: savedPending.id,
                    userId: user.id,
                    result,
                  },
                );
              })
              .catch((error) => {
                this.logger.error(
                  `Sync failed for pending student ${savedPending.id}`,
                  "pending-student-verifications",
                  error instanceof Error ? error.stack : undefined,
                  {
                    pendingId: savedPending.id,
                    userId: user.id,
                    error: error instanceof Error ? error.message : String(error),
                  },
                );
              });
          } else {
            this.logger.info(
              `No user found for pending student ${savedPending.id}, will sync when user registers`,
              "pending-student-verifications",
              {
                pendingId: savedPending.id,
                email: dto.email,
              },
            );
          }
        } catch (syncError) {
          // Don't fail the create if sync fails, just log it
          this.logger.error(
            `Failed to trigger sync for pending student ${savedPending.id}`,
            "pending-student-verifications",
            syncError instanceof Error ? syncError.stack : undefined,
            {
              pendingId: savedPending.id,
              email: dto.email,
              error: syncError instanceof Error ? syncError.message : String(syncError),
            },
          );
        }
      }

      return savedPending;
    } catch (error) {
      this.logger.error(`Failed to create pending student verification`, "pending-student-verifications", error.stack, {
        error,
        errorCode: error.code,
        errorMessage: error.message,
      });
      throw new BadRequestException(`Failed to create pending student verification`);
    }
  }

  async update(
    id: string,
    dto: UpdatePendingStudentVerificationDto,
  ): Promise<PendingStudentVerification> {
    const entity = await this.dao.findPendingById(id);
    if (!entity) {
      throw new NotFoundException(
        `Pending student verification with ID ${id} not found`,
      );
    }

    // Validate and resolve input
    const validated = await this.validateAndResolveInput(dto, entity);

    // Check for duplicate pending entry with same student_id, school_id, major_id, degree, and diploma_level
    const duplicate = await this.dao.findPendingByStudentSchoolMajorDegreeDiploma(
      validated.student_id,
      validated.school_id,
      validated.major_id,
      validated.degree,
      validated.diploma_level,
    );
    if (duplicate && duplicate.id !== id) {
      throw new BadRequestException(
        "Pending student verification already exists for this student, school, major, degree, and diploma level",
      );
    }

    try {
      Object.assign(entity, { ...dto, major_id: validated.major_id });
      return await this.dao.savePending(entity);
    } catch (error) {
      // Fallback: catch database foreign key constraint errors
      this.logger.error(`Failed to update pending student verification with ID ${id}`, "pending-student-verifications", error.stack, {
        error,
        errorCode: error.code,
        errorMessage: error.message,
      });
      throw new BadRequestException(`Failed to update pending student verification with ID ${id}`);
    }
  }

  async remove(id: string): Promise<void> {
    const found = await this.dao.findPendingById(id);
    if (!found) {
      throw new NotFoundException(
        `Pending student verification with ID ${id} not found`,
      );
    }
    await this.dao.softDeleteById(id);
  }

  async findOneByStudentSchoolMajorDegreeDiploma(
    student_id: string,
    school_id: string,
    major_id: string,
    degree: string,
    diploma_level: string | null,
  ): Promise<PendingStudentVerification | null> {
    if (!student_id || !school_id || !major_id || !degree) return null;

    return this.dao.findPendingByStudentSchoolMajorDegreeDiploma(
      student_id,
      school_id,
      major_id,
      degree,
      diploma_level,
    );
  }

  /**
   * Find all pending student verifications by user email
   * Used to auto-populate education form when user opens education history page
   */
  async findByUserEmail(email: string): Promise<PendingStudentVerification[]> {
    if (!email) return [];
    return this.dao.findPendingByEmail(email);
  }

  /**
   * Sync pending student verifications to user educations for a specific user
   * - Case 2: Updates existing user educations with data from pending students (only if not verified)
   * - Case 3: Auto-inserts new user education from pending if doesn't exist
   * Returns the number of updated and inserted educations
   */
  async syncPendingStudentsToUserEducations(
    userEmail: string,
    userId: string,
  ): Promise<{ updated: number; inserted: number; skipped: number }> {
    if (!userEmail || !userId) {
      this.logger.warn(
        `Sync skipped: missing userEmail or userId`,
        "sync-pending-to-education",
        { userEmail: !!userEmail, userId: !!userId },
      );
      return { updated: 0, inserted: 0, skipped: 0 };
    }

    const result = { updated: 0, inserted: 0, skipped: 0 };

    try {
      this.logger.info(
        `Starting sync for user ${userId} with email ${userEmail}`,
        "sync-pending-to-education",
        { userId, userEmail },
      );

      // Get all pending students for this user
      const pendingStudents = await this.dao.findPendingByEmail(userEmail);

      this.logger.info(
        `Found ${pendingStudents.length} pending students for email ${userEmail}`,
        "sync-pending-to-education",
        {
          userEmail,
          pendingCount: pendingStudents.length,
          pendingIds: pendingStudents.map(p => ({
            id: p.id,
            student_id: p.student_id,
            school_id: p.school_id,
          })),
        },
      );

      if (pendingStudents.length === 0) {
        return result;
      }

      // Get user educations for this user
      const userEducations = await this.dao.findEducationsByUserId(userId);

      this.logger.info(
        `Found ${userEducations.length} existing educations for user ${userId}`,
        "sync-pending-to-education",
        {
          userId,
          educationCount: userEducations.length,
          educations: userEducations.map(e => ({
            id: e.id,
            student_id: e.student_id,
            school_id: e.school_id,
          })),
        },
      );

      for (const pending of pendingStudents) {
        // Case 2: Find matching user education by student_id + school_id
        // First try to find in already loaded userEducations array (faster)
        // If not found, query database directly to ensure we don't miss any matches
        const pendingStudentId = pending.student_id?.toString().trim() || "";
        const pendingSchoolId = pending.school_id?.toString().trim() || "";
        
        let matchingEducation: UserEducation | null = null;

        // Priority 1: Try to find in loaded userEducations array by student_id + school_id (exact match)
        // Case 2: Match existing education with same student_id + school_id
        if (pendingStudentId !== "" && pendingSchoolId !== "") {
          // First try exact match in loaded array
          matchingEducation = userEducations.find(
            (edu) => {
              // Direct comparison first (faster)
              if (edu.student_id === pending.student_id && edu.school_id === pending.school_id) {
                return true;
              }
              
              // Fallback: string comparison with trim (handle whitespace issues)
              const eduStudentId = String(edu.student_id || "").trim();
              const eduSchoolId = String(edu.school_id || "").trim();
              
              return (
                eduStudentId === pendingStudentId &&
                eduSchoolId === pendingSchoolId &&
                eduStudentId !== "" &&
                eduSchoolId !== ""
              );
            },
          ) || null;

          // If not found in array, query database directly with user_id filter
          // This ensures we don't miss any matches due to data not being loaded
          if (!matchingEducation) {
            const dbEducation = await this.dao.findEducationByStudentAndSchool(
              pending.student_id,
              pending.school_id,
              userId, // Filter by user_id to ensure we only get education for this user
            );
            if (dbEducation) {
              matchingEducation = dbEducation;
              // Add to userEducations array if not already there
              if (!userEducations.find(e => e.id === dbEducation.id)) {
                userEducations.push(dbEducation);
              }
            }
          }
        }

        // Priority 2: Fallback - Match by school_id only if existing education has no student_id
        // This handles Case 2 where existing education might not have student_id yet
        if (!matchingEducation && pendingSchoolId !== "") {
          matchingEducation = userEducations.find(
            (edu) => {
              const eduStudentId = edu.student_id?.toString().trim() || "";
              const eduSchoolId = edu.school_id?.toString().trim() || "";
              
              // Match by school_id only if existing education has no student_id
              return (
                eduSchoolId === pendingSchoolId &&
                eduSchoolId !== "" &&
                (eduStudentId === "" || eduStudentId === null || !eduStudentId)
              );
            },
          ) || null;
        }

        // Log for debugging
        if (matchingEducation) {
          this.logger.info(
            `[Case 2] Found matching education for pending student ${pending.id}, will UPDATE`,
            "sync-pending-to-education",
            {
              pendingId: pending.id,
              pendingStudentId: pending.student_id,
              pendingSchoolId: pending.school_id,
              educationId: matchingEducation.id,
              educationStudentId: matchingEducation.student_id,
              educationSchoolId: matchingEducation.school_id,
              userId: userId,
            },
          );
        } else {
          this.logger.info(
            `[Case 3] No matching education found for pending student ${pending.id}, will CREATE NEW`,
            "sync-pending-to-education",
            {
              pendingId: pending.id,
              pendingStudentId: pending.student_id,
              pendingSchoolId: pending.school_id,
              userId: userId,
              existingEducationsCount: userEducations.length,
              existingEducations: userEducations.map(e => ({
                id: e.id,
                student_id: e.student_id,
                school_id: e.school_id,
                user_id: e.user_id,
              })),
            },
          );
        }

        // Get school name
        const school = await this.dao.findSchoolById(pending.school_id);
        if (!school) {
          this.logger.warn(
            `School not found for pending student ${pending.id}`,
            "sync-pending-to-education",
            { pendingId: pending.id, schoolId: pending.school_id },
          );
          result.skipped++;
          continue;
        }

        if (matchingEducation) {
          // Case 2: Update existing education (only if not verified)
          if (matchingEducation.is_verified) {
            result.skipped++;
            continue;
          }

          // Update only relevant fields from pending student
          // Preserve existing fields like start_date, end_date, file_url, etc.
          let hasChanges = false;

          if (matchingEducation.school_id !== pending.school_id) {
            matchingEducation.school_id = pending.school_id;
            hasChanges = true;
          }

          if (matchingEducation.institution_name !== school.name) {
            matchingEducation.institution_name = school.name;
            hasChanges = true;
          }

          if (pending.major && matchingEducation.major !== pending.major) {
            matchingEducation.major = pending.major;
            hasChanges = true;
          }

          if (pending.major_id && matchingEducation.major_id !== pending.major_id) {
            matchingEducation.major_id = pending.major_id;
            hasChanges = true;
          }

          if (matchingEducation.education_degree !== pending.degree) {
            matchingEducation.education_degree = pending.degree;
            hasChanges = true;
          }

          // Always update student_id if pending has student_id (even if existing is null/empty)
          const pendingStudentId = pending.student_id?.toString().trim() || "";
          const existingStudentId = matchingEducation.student_id?.toString().trim() || "";
          if (pendingStudentId !== "" && existingStudentId !== pendingStudentId) {
            matchingEducation.student_id = pending.student_id;
            hasChanges = true;
          }

          if (pending.diploma_level !== null && pending.diploma_level !== undefined) {
            if (matchingEducation.diploma_level !== pending.diploma_level) {
              matchingEducation.diploma_level = pending.diploma_level;
              hasChanges = true;
            }
          }

          // Update region_id from school if available
          if (school.region_id && matchingEducation.region_id !== school.region_id) {
            matchingEducation.region_id = school.region_id;
            hasChanges = true;
          }

          // Reset is_outside_indo since pending students are always in Indonesia
          if (matchingEducation.is_outside_indo !== false) {
            matchingEducation.is_outside_indo = false;
            hasChanges = true;
          }

          if (matchingEducation.other_country !== null) {
            matchingEducation.other_country = null;
            hasChanges = true;
          }

          if (matchingEducation.other_region !== null) {
            matchingEducation.other_region = null;
            hasChanges = true;
          }

          // Save if there are changes
          if (hasChanges) {
            const savedEducation = await this.dao.saveEducation(matchingEducation);
            
            // Update helper fields
            await this.educationHelperService.updateIsSchoolVerifiedStatus(savedEducation);
            await this.educationHelperService.updateMajorId(savedEducation);
            
            // Delete the pending verification after successful update (Case 2)
            await this.dao.softDeleteById(pending.id);
            
            result.updated++;

            this.logger.info(
              `Updated user education ${matchingEducation.id} with pending student data ${pending.id}`,
              "sync-pending-to-education",
              {
                educationId: matchingEducation.id,
                pendingId: pending.id,
                userId,
              },
            );
          } else {
            result.skipped++;
          }
        } else {
          // Case 3: Auto-insert new education from pending
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
            region_id: school.region_id || undefined,
            start_date: new Date(), // Default date, user can update later
            is_current: false,
            file_url: undefined,
            certificate_number: undefined,
            curriculum_year: undefined,
          };

          // Create user education using service (this will handle all the necessary steps)
          const savedEducation = await this.userEducationsService.create(educationDto);

          // Delete the pending verification after successful insertion (Case 3)
          await this.dao.softDeleteById(pending.id);

          result.inserted++;

          this.logger.info(
            `Auto-inserted user education from pending student ${pending.id} for user ${userId}`,
            "sync-pending-to-education",
            {
              educationId: savedEducation.id,
              pendingId: pending.id,
              userId,
            },
          );
        }
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to sync pending students to user educations for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
        "sync-pending-to-education",
        error instanceof Error ? error.stack : undefined,
        { userId, userEmail },
      );
      throw error;
    }
  }

  /**
   * Validate and resolve input fields (DRY - shared by create and update)
   * Handles FK validation, major resolution, and diploma_level validation
   */
  private async validateAndResolveInput(
    dto: CreatePendingStudentVerificationDto | UpdatePendingStudentVerificationDto,
    existingEntity?: PendingStudentVerification,
  ): Promise<{
    student_id: string;
    school_id: string;
    major_id: string;
    degree: string;
    diploma_level: string | null;
  }> {
    // Determine final values (use dto if provided, otherwise use existing entity values)
    const student_id = dto.student_id ?? existingEntity?.student_id ?? "";
    const school_id = dto.school_id ?? existingEntity?.school_id ?? "";

    if (!school_id || !student_id) {
      throw new BadRequestException("School ID and student ID are required");
    }


    // Validate foreign key: school must exist
    // For update: only validate if school_id is being changed
    if (existingEntity) {
      if (dto.school_id && dto.school_id !== existingEntity.school_id) {
        await this.validateFK(dto.school_id);
      }
    } else {
      // For create: always validate
      await this.validateFK(school_id);
    }

    // Do not allow buffer entry if user_educations already has this student+school
    await this.validateNoExistingEducation(student_id, school_id);

    // Resolve major_id: prefer dto.major_id if provided, otherwise resolve from major string
    let major_id = existingEntity?.major_id;
    
    // If major_id is provided in DTO, validate it exists and use it
    if (dto.major_id) {
      const majorExists = await this.majorRepository.findOne({
        where: { id: dto.major_id, deleted_at: IsNull() },
      });
      if (!majorExists) {
        throw new BadRequestException("Invalid major ID provided");
      }
      major_id = dto.major_id;
    } else if (!major_id && dto.major) {
      // Otherwise, try to resolve from major string
      major_id = await this.resolveMajorId(dto.major);
    }

    if (!major_id) {
      throw new BadRequestException("Major ID is required. Please select a major from the list or ensure the major name matches an existing major.");
    }

    // Validate diploma_level if provided
    if (dto.diploma_level !== undefined) {
      await this.validateDiplomaLevel(dto.diploma_level);
    }

    // Determine final values for degree and diploma_level
    const degree = dto.degree ?? existingEntity?.degree ?? (dto as CreatePendingStudentVerificationDto).degree;
    if (!degree) {
      throw new BadRequestException("degree is required");
    }
    const diploma_level = dto.diploma_level !== undefined
      ? (dto.diploma_level || null)
      : existingEntity?.diploma_level ?? null;

    return {
      student_id,
      school_id,
      major_id,
      degree,
      diploma_level,
    };
  }

  /**
   * Validate that no existing education exists for the given student and school.
   * Throws status-specific error messages based on approval_state.
   * 
   * Case 2: If existing education is not verified (is_verified = false), allow create pending student.
   * The existing education will be updated by syncPendingStudentsToUserEducations later.
   */
  private async validateNoExistingEducation(studentId: string, schoolId: string): Promise<void> {
    const existingEducation = await this.dao.findEducationByStudentAndSchool(
      studentId,
      schoolId,
    );
    if (!existingEducation) return;

    // If education is already verified (approved), prevent creating pending student
    if (existingEducation.is_verified || existingEducation.approval_state === ApprovalState.APPROVED) {
      throw new BadRequestException(
        "This student already approved",
      );
    }

    // Case 2: If education exists but not verified, allow create pending student
    // The syncPendingStudentsToUserEducations will update the existing education
    // So we don't throw error here - just return and allow the create to proceed
    return;
  }

  /**
   * Validate foreign key constraints before database operations.
   * Prevents database-level constraint violations by checking existence upfront.
   */
  private async validateFK(school_id: string): Promise<void> {
    if (!school_id) {
      throw new BadRequestException("School ID is required");
    }

    const school = await this.dao.findSchoolById(school_id);
    if (!school) {
      throw new BadRequestException("School not found or invalid school ID");
    }
  }

  /**
   * Validate diploma_level against config
   */
  private async validateDiplomaLevel(diploma_level: string): Promise<void> {
    if (!diploma_level) {
      return; // Allow null/empty
    }

    try {
      const educationLevelConfig = await this.configService.findByKey("education_level");
      const validLevels = educationLevelConfig.value.map((l: any) => l.code);
      if (!validLevels.includes(diploma_level)) {
        throw new BadRequestException(
          `Invalid diploma level: ${diploma_level}. Valid levels: ${validLevels.join(", ")}`
        );
      }
    } catch (error) {
      // If config not found, skip validation
      if (error instanceof NotFoundException) {
        this.logger.warn("Education level config not found, skipping diploma_level validation");
      } else {
        throw error;
      }
    }
  }

  /**
   * Resolve major_id from major string.
   * If major string is provided, find existing major or create new one.
   * Returns major_id or null if major string is not provided or empty.
   */
  private async resolveMajorId(major?: string): Promise<string | null> {
    // Early return if major string is not provided or empty after trim
    if (!major) {
      return null;
    }

    const trimmedMajor = major.trim();
    if (!trimmedMajor) {
      return null;
    }

    // Case-insensitive search to avoid duplicates
    const existingMajor = await this.majorRepository
      .createQueryBuilder("major")
      .where("LOWER(major.major_name) = LOWER(:name)", {
        name: trimmedMajor,
      })
      .andWhere("major.deleted_at IS NULL")
      .getOne();

    if (existingMajor) {
      // Use existing major
      return existingMajor.id;
    }

    // Create new major
    try {
      const newMajor = this.majorRepository.create({
        major_name: trimmedMajor,
      });
      const savedMajor = await this.majorRepository.save(newMajor);
      return savedMajor.id;
    } catch (error) {
      this.logger.error(
        `Error creating new major: ${error.message} with stack: ${error.stack}`,
        "major_auto_creation"
      );
      throw new BadRequestException(`Something went wrong while creating new major, Please try again later.`);
    }
  }

  /**
   * Helper: Extract cell value from ExcelJS cell, handling hyperlinks and objects
   * ExcelJS cells with hyperlinks return objects like { text: 'value', hyperlink: 'url' }
   */
  private extractCellValue(cell: ExcelJS.Cell): string {
    if (!cell || cell.value === null || cell.value === undefined) {
      return "";
    }

    const value = cell.value;

    // If it's already a string, return it
    if (typeof value === "string") {
      return value;
    }

    // If it's a number, boolean, or Date, convert to string
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    // If it's an object (common for hyperlink cells)
    if (typeof value === "object" && value !== null) {
      // ExcelJS hyperlink cells have 'text' property that contains the display text
      // Type guard: check if it's a CellHyperlinkValue
      if ("text" in value && typeof (value as any).text === "string") {
        return String((value as any).text);
      }
      // Some cells might have 'richText' array (CellRichTextValue)
      if ("richText" in value && Array.isArray((value as any).richText)) {
        return (value as any).richText.map((rt: any) => rt.text || "").join("");
      }
      // If object has toString method, use it
      if (typeof value.toString === "function") {
        try {
          return value.toString();
        } catch {
          // If toString fails, fall through to String conversion
        }
      }
      // Last resort: try String conversion
      // For hyperlink objects, we should have caught it with .text above
      return String(value);
    }

    // Fallback: convert to string
    return String(value);
  }

  /**
   * Import from Excel rows: student_id, school_name
   * Fails fast if any school name not found.
   */
  async importFromExcel(
    filePath: string,
  ): Promise<{
    success_count: number;
    error_count: number;
    errors: { row: number; message: string }[];
  }> {
    if (!filePath) {
      throw new BadRequestException("File path is required");
    }

    const result = {
      success_count: 0,
      error_count: 0,
      errors: [] as { row: number; message: string }[],
    };

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new BadRequestException("Worksheet not found in Excel file");
    }

    for (const row of worksheet.getRows(2, worksheet.rowCount - 1) || []) {
      try {
        const rowNumber = row.number;
        // Use extractCellValue to properly handle hyperlinks and cell objects
        const student_id = this.extractCellValue(row.getCell(1)).trim();
        const school_name = this.extractCellValue(row.getCell(2)).trim();
        const full_name = this.extractCellValue(row.getCell(3)).trim() || undefined;
        const photo_url = this.extractCellValue(row.getCell(4)).trim() || undefined;
        const email = this.extractCellValue(row.getCell(5)).trim() || undefined;
        const phone_num = this.extractCellValue(row.getCell(6)).trim() || undefined;
        const major = this.extractCellValue(row.getCell(7)).trim() || undefined;
        const degree = this.extractCellValue(row.getCell(8)).trim() || undefined;
        const diploma_level = this.extractCellValue(row.getCell(9)).trim() || undefined;

        // Only truly required fields for creating a pending entry
        // - student_id (required)
        // - school_name (required to resolve school_id)
        // - degree (required by DTO/entity)
        const missing: string[] = [];
        if (!student_id) missing.push("student_id");
        if (!school_name) missing.push("school_name");
        if (!degree) missing.push("degree");
        if (missing.length > 0) {
          throw new BadRequestException(
            `Missing required fields: ${missing.join(", ")}`,
          );
        }

        const school = await this.dao.findSchoolByName(school_name);
        if (!school) {
          throw new BadRequestException(
            `School not found: ${school_name}`,
          );
        }

        await this.create({
          student_id,
          school_id: school.id,
          full_name,
          photo_url,
          email,
          phone_num,
          major,
          degree,
          diploma_level,
        });
        result.success_count++;
      } catch (error) {
        result.error_count++;
        result.errors.push({
          row: row.number,
          message: error?.message || "Failed to import row",
        });
      }
    }

    return result;
  }
}

