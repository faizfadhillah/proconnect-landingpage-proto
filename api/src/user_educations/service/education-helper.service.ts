import { Injectable, BadRequestException } from "@nestjs/common";
import { UserEducation } from "../entities/user_education.entity";
import { UserEducationsDao } from "../dao/user_educations.dao";
import { LoggingService } from "../../logs/logs.service";

/**
 * Helper service for education metadata management
 * (school verification, major management, school-major links)
 */
@Injectable()
export class EducationHelperService {
  constructor(
    private readonly userEducationsDao: UserEducationsDao,
    private readonly logger: LoggingService,
  ) { }

  /**
   * Update school verification status for user
   * Creates school if it doesn't exist based on institution_name
   */
  async updateIsSchoolVerifiedStatus(
    userEducation: UserEducation,
  ): Promise<void> {
    if (!userEducation.school_id) {
      const is_school = await this.userEducationsDao.findSchoolByName(userEducation.institution_name);
      if (!is_school) {
        const newSchool = await this.userEducationsDao.createSchool({
          name: userEducation.institution_name,
          region_id: userEducation.region_id,
          address: userEducation.region_id
            ? ""
            : (userEducation.other_region || "") +
            " " +
            (userEducation.other_country || ""),
        });
        userEducation.school_id = newSchool.id;
        await this.userEducationsDao.save(userEducation);
      } else {
        // Set school_id if school already exists
        userEducation.school_id = is_school.id;
        await this.userEducationsDao.save(userEducation);
      }
    }

    const user = await this.userEducationsDao.findUserById(userEducation.user_id);
    if (!user) {
      return; // User not found, skip
    }

    const userEducations = await this.userEducationsDao.findWithVerifiedSchools(user.id);
    user.is_school_verified = userEducations.length ? true : false;
    await this.userEducationsDao.saveUser(user);
  }

  /**
   * Auto-create or link major_id based on major string field
   * Similar to updateIsSchoolVerifiedStatus flow
   * Also auto-creates/connects to mst_school_major if school_id is available
   */
  async updateMajorId(userEducation: UserEducation): Promise<void> {
    if (userEducation.major_id) {
      await this.ensureSchoolMajorLink(userEducation.school_id, userEducation.major_id, userEducation.id);
      return;
    }

    if (!userEducation.major) {
      return;
    }

    this.logger.log(`Updating major_id for user education ${userEducation.id}`, "major_auto_creation", { educationId: userEducation.id });

    let majorId: string;

    // Case-insensitive search to avoid duplicates
    const trimmedMajor = userEducation.major.trim();
    const existingMajor = await this.userEducationsDao.findMajorByName(trimmedMajor);
    if (existingMajor) {
      // Use existing major
      majorId = existingMajor.id;
    } else {
      // Create new major
      try {
        const newMajor = await this.userEducationsDao.createMajor({
          major_name: trimmedMajor,
        });
        majorId = newMajor.id;
        this.logger.log(
          `Created new major: ${trimmedMajor} (${majorId})`,
          "major_auto_creation",
          { educationId: userEducation.id }
        );
      } catch (error) {
        this.logger.error(
          `Error creating new major: ${error.message} with stack: ${error.stack} | educationId: ${userEducation.id}`,
          "major_auto_creation"
        );
        throw new BadRequestException(`Something went wrong while creating new major, Please try again later.`);
      }
    }

    // Update education with major_id
    userEducation.major_id = majorId;
    await this.userEducationsDao.save(userEducation);

    // Auto-create/connect to mst_school_major if school_id is available
    await this.ensureSchoolMajorLink(userEducation.school_id, majorId, userEducation.id);
  }

  /**
   * Ensure school-major relationship exists in mst_school_major
   * Creates the relationship if it doesn't exist
   * @param schoolId School ID (optional)
   * @param majorId Major ID
   * @param educationId Education ID for logging context
   */
  private async ensureSchoolMajorLink(
    schoolId: string | null | undefined,
    majorId: string,
    educationId?: string
  ): Promise<void> {
    if (!schoolId) {
      this.logger.debug(
        `Skipping school-major link creation: school_id is not available`,
        "major_auto_creation",
        { educationId, majorId }
      );
      return;
    }

    try {
      // Check if school-major relationship already exists
      const existingSchoolMajor = await this.userEducationsDao.findSchoolMajorBySchoolAndMajor(
        schoolId,
        majorId
      );

      if (!existingSchoolMajor) {
        // Create new school-major relationship
        await this.userEducationsDao.createSchoolMajor({
          school_id: schoolId,
          major_id: majorId,
        });
        this.logger.debug(
          `Auto-created school-major link: school=${schoolId}, major=${majorId}`,
          "major_auto_creation",
          { educationId }
        );
      }
    } catch (error) {
      // Log but don't fail - the major_id is already set in userEducation
      // This ensures the main operation (setting major_id) succeeds even if school-major link creation fails
      this.logger.warn(
        `Failed to create school-major link: ${error.message} | school=${schoolId}, major=${majorId}`,
        "major_auto_creation",
        { educationId, stack: error.stack }
      );
    }
  }

  /**
   * Get available majors for a school
   */
  async getAvailableMajors(schoolId: string): Promise<Array<{ id: string; name: string }>> {
    const schoolMajors = await this.userEducationsDao.findSchoolMajorsBySchool(schoolId);

    // Extract distinct majors
    const majorMap = new Map<string, { id: string; name: string }>();
    for (const sm of schoolMajors) {
      if (sm.major && !sm.major.deleted_at) {
        majorMap.set(sm.major.id, {
          id: sm.major.id,
          name: sm.major.major_name,
        });
      }
    }

    return Array.from(majorMap.values());
  }
}

