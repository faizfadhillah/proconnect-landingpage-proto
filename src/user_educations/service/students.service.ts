import { Injectable } from "@nestjs/common";
import { BasePagination } from "../../base.pagination";
import { StudentStatusResponseDto } from "../dto/student-status-response.dto";
import { StudentLicenseResponseDto } from "../dto/student-license-response.dto";
import { StudentEducationDetailDto } from "../dto/student-education-detail.dto";
import { GetStudentsFilterDto } from "../dto/get-students-filter.dto";
import { AccountStatus } from "../enums/account-status.enum";
import { StudentVerificationStatus } from "../enums/student-verification-status.enum";
import { StudentsDao } from "../dao/students.dao";
import { EncryptedUserDataService } from "../../encrypted_user_data/encrypted_user_data.service";
import { UserCertificatesService } from "../../user_certificates/user_certificates.service";
import { MstLicenseSkillMappingsService } from "../../mst_license_skill_mappings/mst_license_skill_mappings.service";
import { MstEducationLicenseMappingDao } from "../../mst_education_license_mappings/dao/mst_education_license_mapping.dao";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class StudentsService {
  constructor(
    private readonly studentsDao: StudentsDao,
    private readonly encryptedUserDataService: EncryptedUserDataService,
    private readonly userCertificatesService: UserCertificatesService,
    private readonly mstLicenseSkillMappingsService: MstLicenseSkillMappingsService,
    private readonly mstEducationLicenseMappingDao: MstEducationLicenseMappingDao,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Get students with verification status aggregation and filtering
   * Uses DB-level pagination, filtering, and grouping for better performance
   */
  async getStudents(
    filters?: GetStudentsFilterDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<BasePagination<StudentStatusResponseDto>> {
    this.logger.log(
      `Fetching students with filters: ${JSON.stringify(filters)}, page: ${page}, limit: ${limit}`,
      "students_service",
      { filters, page, limit },
    );

    // Get paginated and grouped results from DB (already aggregated)
    const [groupedResults, total] = await Promise.all([
      this.studentsDao.getStudentsGroupedWithPagination(filters, page, limit),
      this.studentsDao.getStudentsCount(filters),
    ]);

    this.logger.log(
      `Found ${groupedResults.length} grouped students (total: ${total})`,
      "students_service",
      { count: groupedResults.length, total },
    );

    // Extract user_ids from grouped results (JOINED) for phone decryption and license fetching
    // Pending (NOT_JOINED) already has phone_num from table, no need to decrypt
    const userIds = groupedResults
      .filter((r) => r.user_id && r.account_status === AccountStatus.JOINED)
      .map((r) => r.user_id!)
      .filter((id, index, self) => self.indexOf(id) === index); // Get unique user_ids

    // Extract pending student data for license fetching (NOT_JOINED)
    const pendingStudents =
      this.extractPendingStudentsForLicenseFetching(groupedResults);

    if (userIds.length > 0 || pendingStudents.length > 0) {
      this.logger.log(
        `Fetching licenses: ${userIds.length} joined users, ${pendingStudents.length} pending students`,
        "students_service",
        { joinedCount: userIds.length, pendingCount: pendingStudents.length },
      );
    }

    // Fetch licenses and phone decryption in parallel
    const [
      decryptedPhoneMap,
      licensesForJoinedUsers,
      licensesForPendingStudents,
    ] = await Promise.all([
      // Decrypt phone numbers only for educations (more efficient)
      userIds.length > 0
        ? this.encryptedUserDataService.findBulkDecrypted(userIds)
        : Promise.resolve(new Map()),
      // Fetch licenses for joined users
      this.getLicensesWithSkillsForJoinedUsers(userIds),
      // Fetch licenses for pending students
      this.getLicensesWithSkillsForPendingStudents(pendingStudents),
    ]);

    // Collect all education criteria for batch license fetching
    const allEducationCriteria: Array<{
      school_id: string;
      major_id: string | null;
      degree: string;
      diploma_level: string | null;
    }> = [];

    // Parse all educations first to collect criteria
    // Now each row represents 1 education, so educations is a single object, not array
    const parsedEducationsMap = new Map<number, StudentEducationDetailDto[]>();
    for (let i = 0; i < groupedResults.length; i++) {
      const row = groupedResults[i];
      let educations: StudentEducationDetailDto[] = [];
      if (row.educations) {
        try {
          let educationObj: any = null;
          if (typeof row.educations === "string") {
            educationObj = JSON.parse(row.educations);
          } else if (typeof row.educations === "object") {
            educationObj = row.educations;
          }

          // Convert single object to array (1 education per row)
          if (educationObj && !Array.isArray(educationObj)) {
            educations = [educationObj];
          } else if (Array.isArray(educationObj)) {
            educations = educationObj;
          }
          
          // Log parsed education data for debugging (first few only)
          if (i < 3 && educations.length > 0) {
            this.logger.log(
              `Parsed education data for debugging`,
              "students_service",
              {
                index: i,
                student_id: row.student_ids?.[0],
                education: educations[0],
              },
            );
          }
        } catch (error) {
          this.logger.warn(
            `Failed to parse educations for student: ${row.student_ids?.[0]}`,
            "students_service",
            { error, educations: row.educations },
          );
          educations = [];
        }
      }
      parsedEducationsMap.set(i, educations);

      // Collect criteria for batch fetching
      for (const education of educations) {
        // Normalize and validate fields
        const schoolId = education.school_id ? String(education.school_id).trim() : null;
        const majorId = education.major_id ? String(education.major_id).trim() : null;
        const degree = education.degree ? String(education.degree).trim() : null;
        const diplomaLevel = education.diploma_level != null ? String(education.diploma_level).trim() : null;
        
        if (schoolId && majorId && degree) {
          allEducationCriteria.push({
            school_id: schoolId,
            major_id: majorId,
            degree: degree,
            diploma_level: diplomaLevel,
          });
        } else {
          // Log missing fields for debugging
          this.logger.warn(
            `Skipping education criteria collection due to missing fields`,
            "students_service",
            {
              education: {
                school_id: schoolId,
                major_id: majorId,
                degree: degree,
                diploma_level: diplomaLevel,
                raw: {
                  school_id: education.school_id,
                  major_id: education.major_id,
                  degree: education.degree,
                  diploma_level: education.diploma_level,
                },
              },
              student_id: education.student_id,
              user_education_id: education.user_education_id,
            },
          );
        }
      }
    }

    // Batch fetch all license mappings
    const allMappings =
      allEducationCriteria.length > 0
        ? await this.mstEducationLicenseMappingDao.findByEducationCriteria(
            allEducationCriteria,
          )
        : [];

    // Extract unique license IDs and fetch skills in batch
    const uniqueLicenseIds = new Set<string>();
    for (const mapping of allMappings) {
      if (mapping.license?.id) {
        uniqueLicenseIds.add(mapping.license.id);
      }
    }

    const skillsByLicenseId =
      uniqueLicenseIds.size > 0
        ? await this.mstLicenseSkillMappingsService.findSkillsByLicenseIds(
            Array.from(uniqueLicenseIds),
          )
        : new Map<string, string[]>();

    // Build a map: criteria key -> licenses[]
    const licensesByCriteria = new Map<string, StudentLicenseResponseDto[]>();
    for (const mapping of allMappings) {
      if (!mapping.license) continue;

      // Normalize values to ensure consistent key matching
      const normalizedSchoolId = String(mapping.school_id).trim();
      const normalizedMajorId = String(mapping.major_id || "").trim();
      const normalizedDegree = String(mapping.degree).trim();
      const normalizedDiplomaLevel = String(mapping.diploma_level || "").trim();
      
      const key = `${normalizedSchoolId}|${normalizedMajorId}|${normalizedDegree}|${normalizedDiplomaLevel}`;
      const skills = skillsByLicenseId.get(mapping.license.id) || [];
      const licenseDto = StudentLicenseResponseDto.fromLicenseTemplate(
        mapping.license,
        skills,
      );

      const existing = licensesByCriteria.get(key) || [];
      const exists = existing.some(
        (l) => l.mst_license_id === mapping.license.id,
      );
      if (!exists) {
        existing.push(licenseDto);
        licensesByCriteria.set(key, existing);
      }
    }
    
    // Log summary for debugging
    if (allEducationCriteria.length > 0) {
      this.logger.log(
        `Built licensesByCriteria map: ${licensesByCriteria.size} unique criteria keys from ${allMappings.length} mappings`,
        "students_service",
        {
          totalCriteria: allEducationCriteria.length,
          totalMappings: allMappings.length,
          uniqueKeys: licensesByCriteria.size,
        },
      );
    }

    // Map grouped results to DTO format with phone decryption and licenses
    const items: StudentStatusResponseDto[] = groupedResults.map(
      (row, index) => {
        // For pending (NOT_JOINED), use phone_num directly from query result
        // For educations (JOINED), decrypt from encrypted_user_data
        let phone_num: string | null = row.phone_num || null;
        if (row.account_status === AccountStatus.JOINED && row.user_id) {
          const decrypted = decryptedPhoneMap.get(row.user_id);
          phone_num = decrypted?.encrypted_phone ?? null;
        }

        // Lookup licenses based on account status
        let licenses: StudentLicenseResponseDto[] = [];
        if (row.account_status === AccountStatus.JOINED && row.user_id) {
          licenses = licensesForJoinedUsers.get(row.user_id) || [];
        } else if (
          row.account_status === AccountStatus.NOT_JOINED &&
          row.student_ids &&
          row.student_ids.length > 0
        ) {
          // Use first student_id: all share the same education criteria, so licenses are identical
          const studentId = row.student_ids[0];
          licenses = licensesForPendingStudents.get(studentId) || [];
        }

        // Get parsed educations for this row
        const educations = parsedEducationsMap.get(index) || [];

        // Map licenses to each education based on criteria
        const educationsWithLicenses = educations.map((education) => {
          let mappedLicenses: StudentLicenseResponseDto[] = [];

          if (
            education.school_id &&
            education.major_id &&
            education.degree
          ) {
            // Normalize values to ensure consistent key matching (diploma_level optional; null/empty -> "" for key)
            const normalizedSchoolId = String(education.school_id).trim();
            const normalizedMajorId = String(education.major_id).trim();
            const normalizedDegree = String(education.degree).trim();
            const normalizedDiplomaLevel = (education.diploma_level ?? "").trim();
            
            const key = `${normalizedSchoolId}|${normalizedMajorId}|${normalizedDegree}|${normalizedDiplomaLevel}`;
            mappedLicenses = licensesByCriteria.get(key) || [];
            
            // Log for debugging if no licenses found but criteria exists
            if (mappedLicenses.length === 0 && licensesByCriteria.size > 0) {
              this.logger.warn(
                `No mapped licenses found for education criteria`,
                "students_service",
                {
                  key,
                  education: {
                    school_id: normalizedSchoolId,
                    major_id: normalizedMajorId,
                    degree: normalizedDegree,
                    diploma_level: normalizedDiplomaLevel || null,
                  },
                  availableKeys: Array.from(licensesByCriteria.keys()).slice(0, 5), // Log first 5 keys for debugging
                  student_id: education.student_id,
                  user_education_id: education.user_education_id,
                },
              );
            }
          } else {
            // Log missing fields for debugging
            this.logger.warn(
              `Education missing required fields for license mapping`,
              "students_service",
              {
                education: {
                  school_id: education.school_id,
                  major_id: education.major_id,
                  degree: education.degree,
                  diploma_level: education.diploma_level,
                },
                student_id: education.student_id,
                user_education_id: education.user_education_id,
              },
            );
          }

          return {
            ...education,
            mapped_licenses: mappedLicenses,
          };
        });

        return {
          student_ids: row.student_ids || [],
          full_name: row.full_name,
          photo_url: row.photo_url,
          email: row.email,
          phone_num,
          majors: row.majors || [],
          educations:
            educationsWithLicenses.length > 0
              ? educationsWithLicenses
              : undefined,
          status: row.status as StudentVerificationStatus,
          account_status: row.account_status as AccountStatus,
          licenses,
        };
      },
    );

    // Calculate totalPages: if limit is -1 or 0, set to 1 (all items in one page)
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Extract pending student data for license fetching (NOT_JOINED)
   * Only include students with all required fields (no null values)
   * @param groupedResults Array of grouped student results from DB
   * @returns Array of pending student data with all required fields
   */
  private extractPendingStudentsForLicenseFetching(
    groupedResults: Array<{
      account_status: string;
      student_ids?: string[];
      school_id: string | null;
      major_id: string | null;
      degree: string | null;
      diploma_level: string | null;
    }>,
  ): Array<{
    student_id: string;
    school_id: string;
    major_id: string;
    degree: string;
    diploma_level: string;
  }> {
    return groupedResults
      .filter(
        (r) =>
          r.account_status === AccountStatus.NOT_JOINED &&
          r.student_ids &&
          r.student_ids.length > 0 &&
          r.school_id &&
          r.degree &&
          r.major_id &&
          r.diploma_level,
      )
      .map((r) => ({
        // Use first student_id: all student_ids in the array share the same education criteria
        // (school_id, major_id, degree, diploma_level), so licenses will be identical for all
        student_id: r.student_ids![0],
        school_id: r.school_id!,
        major_id: r.major_id!,
        degree: r.degree!,
        diploma_level: r.diploma_level!,
      }));
  }

  /**
   * Get licenses with skills for joined users (users who have certificates)
   * @param userIds Array of user IDs
   * @returns Map of user_id -> StudentLicenseResponseDto[]
   */
  private async getLicensesWithSkillsForJoinedUsers(
    userIds: string[],
  ): Promise<Map<string, StudentLicenseResponseDto[]>> {
    if (userIds.length === 0) {
      return new Map();
    }

    // Fetch all certificates for userIds (grouped by user_id)
    const certificatesByUser =
      await this.userCertificatesService.findByUserIdsWithEducation(userIds);

    // Extract unique mst_license_id values (filter nulls)
    const licenseIds = new Set<string>();
    for (const certs of certificatesByUser.values()) {
      for (const cert of certs) {
        if (cert.mst_license_id) {
          licenseIds.add(cert.mst_license_id);
        }
      }
    }

    if (licenseIds.size > 0) {
      this.logger.log(
        `Fetching skills for ${licenseIds.size} unique licenses (joined users)`,
        "students_service",
        { licenseCount: licenseIds.size, userIdCount: userIds.length },
      );
    }

    // Fetch license-skill mappings for all unique licenses
    const skillsByLicenseId =
      licenseIds.size > 0
        ? await this.mstLicenseSkillMappingsService.findSkillsByLicenseIds(
            Array.from(licenseIds),
          )
        : new Map<string, string[]>();

    // Transform certificates to StudentLicenseResponseDto[] with skills attached
    const result = new Map<string, StudentLicenseResponseDto[]>();

    for (const [userId, certificates] of certificatesByUser.entries()) {
      const licenseDtos: StudentLicenseResponseDto[] = certificates.map(
        (cert) => {
          const skills = cert.mst_license_id
            ? skillsByLicenseId.get(cert.mst_license_id) || []
            : [];

          return StudentLicenseResponseDto.fromCertificate(cert, skills);
        },
      );

      result.set(userId, licenseDtos);
    }

    // Ensure all userIds have an entry (even if empty array)
    for (const userId of userIds) {
      if (!result.has(userId)) {
        result.set(userId, []);
      }
    }

    return result;
  }

  /**
   * Get licenses with skills for pending students (NOT_JOINED)
   * Based on their education criteria, find matching licenses from education-license mappings
   * @param pendingStudents Array of pending student data
   * @returns Map of student_id -> StudentLicenseResponseDto[]
   */
  private async getLicensesWithSkillsForPendingStudents(
    pendingStudents: Array<{
      student_id: string;
      school_id: string;
      major_id: string;
      degree: string;
      diploma_level: string;
    }>,
  ): Promise<Map<string, StudentLicenseResponseDto[]>> {
    if (pendingStudents.length === 0) {
      return new Map();
    }

    // Build education criteria array
    const criteria = pendingStudents.map((student) => ({
      school_id: student.school_id,
      major_id: student.major_id,
      degree: student.degree,
      diploma_level: student.diploma_level,
    }));

    // Fetch mappings by education criteria (returns MstEducationLicenseMapping[] with license relation)
    // Use DAO directly to get mappings with criteria, so we can match them to specific students
    const mappings =
      await this.mstEducationLicenseMappingDao.findByEducationCriteria(
        criteria,
      );

    // Extract unique license IDs from mappings
    const licenseIds = new Set<string>();
    for (const mapping of mappings) {
      if (mapping.license) {
        licenseIds.add(mapping.license.id);
      }
    }

    if (licenseIds.size > 0) {
      this.logger.log(
        `Found ${mappings.length} education-license mappings, fetching skills for ${licenseIds.size} unique licenses (pending students)`,
        "students_service",
        {
          mappingCount: mappings.length,
          licenseCount: licenseIds.size,
          studentCount: pendingStudents.length,
        },
      );
    }

    // Fetch license-skill mappings for all unique licenses
    const skillsByLicenseId =
      licenseIds.size > 0
        ? await this.mstLicenseSkillMappingsService.findSkillsByLicenseIds(
            Array.from(licenseIds),
          )
        : new Map<string, string[]>();

    // Build a map: student criteria key -> student_id[]
    // This helps us match mappings to students
    // Note: Multiple students can have the same criteria, so we store arrays
    const studentCriteriaMap = new Map<string, string[]>();
    for (const student of pendingStudents) {
      const key = `${student.school_id}|${student.major_id}|${student.degree}|${student.diploma_level}`;
      const existing = studentCriteriaMap.get(key) || [];
      existing.push(student.student_id);
      studentCriteriaMap.set(key, existing);
    }

    // Build result map: student_id -> licenses[]
    const result = new Map<string, StudentLicenseResponseDto[]>();

    // Match each mapping to the students it belongs to
    for (const mapping of mappings) {
      if (!mapping.license) {
        continue;
      }

      // Create criteria key for this mapping
      const mappingKey = `${mapping.school_id}|${mapping.major_id}|${mapping.degree}|${mapping.diploma_level}`;

      // Find student_id(s) that match this mapping's criteria
      const studentIds = studentCriteriaMap.get(mappingKey) || [];

      // Add license to all matching students
      for (const studentId of studentIds) {
        const skills = skillsByLicenseId.get(mapping.license.id) || [];
        const licenseDto = StudentLicenseResponseDto.fromLicenseTemplate(
          mapping.license,
          skills,
        );

        // Add to student's licenses (deduplicate by license_id)
        const existing = result.get(studentId) || [];
        const exists = existing.some(
          (l) => l.mst_license_id === mapping.license.id,
        );
        if (!exists) {
          existing.push(licenseDto);
          result.set(studentId, existing);
        }
      }
    }

    // Ensure all student_ids have an entry (even if empty array)
    for (const student of pendingStudents) {
      if (!result.has(student.student_id)) {
        result.set(student.student_id, []);
      }
    }

    return result;
  }
}
