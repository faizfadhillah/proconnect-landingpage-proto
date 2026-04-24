import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { UserEducation } from "../entities/user_education.entity";
import { GetStudentsFilterDto } from "../dto/get-students-filter.dto";
import { AccountStatus } from "../enums/account-status.enum";
import { StudentQueryResultDto } from "../dto/student-query-result.dto";

@Injectable()
export class StudentsDao {
  constructor(
    @InjectRepository(UserEducation)
    private readonly userEducationRepository: Repository<UserEducation>,
  ) {}

  /**
   * Helper: Build WHERE conditions and parameters for educations and pending queries
   * Returns conditions arrays and parameter tracking objects
   */
  // TODO: coba pake VIEW / another approach.
  private buildFilterConditions(filters?: GetStudentsFilterDto): {
    eduConditions: string[];
    pendingConditions: string[];
    params: any[];
    paramMap: Map<string, number>;
    paramIndex: number;
    getParamIndex: (value: any) => number;
  } {
    const eduConditions: string[] = ["ue.deleted_at IS NULL"];
    const pendingConditions: string[] = ["ps.deleted_at IS NULL"];
    const params: any[] = [];
    const paramMap = new Map<string, number>();
    let paramIndex = 1;

    const getParamIndex = (value: any): number => {
      const key = String(value);
      if (paramMap.has(key)) {
        return paramMap.get(key)!;
      }
      const index = paramIndex++;
      paramMap.set(key, index);
      params.push(value);
      return index;
    };

    if (filters?.school_id) {
      const idx = getParamIndex(filters.school_id);
      eduConditions.push(`ue.school_id = $${idx}`);
      pendingConditions.push(`ps.school_id = $${idx}`);
    }

    if (filters?.major_id) {
      const idx = getParamIndex(filters.major_id);
      eduConditions.push(`ue.major_id = $${idx}`);
      pendingConditions.push(`ps.major_id = $${idx}`);
    }

    if (filters?.name) {
      const nameValue = `%${filters.name}%`;
      const idx = getParamIndex(nameValue);
      eduConditions.push(`u.full_name ILIKE $${idx}`);
      pendingConditions.push(`ps.full_name ILIKE $${idx}`);
    }

    if (filters?.email) {
      const emailValue = `%${filters.email}%`;
      const idx = getParamIndex(emailValue);
      eduConditions.push(`u.email ILIKE $${idx}`);
      pendingConditions.push(`ps.email ILIKE $${idx}`);
    }

    return {
      eduConditions,
      pendingConditions,
      params,
      paramMap,
      paramIndex,
      getParamIndex,
    };
  }

  /**
   * Helper: Build filter conditions and params for pending entries only
   * (excludes major_id since pending entries don't have major_id)
   */
  private buildPendingFilterConditions(filters?: GetStudentsFilterDto): {
    pendingConditions: string[];
    pendingParams: any[];
  } {
    const pendingConditions: string[] = ["ps.deleted_at IS NULL"];
    const pendingParams: any[] = [];
    const pendingParamMap = new Map<string, number>();
    let pendingParamIndex = 1;

    const getPendingParamIndex = (value: any): number => {
      const key = String(value);
      if (pendingParamMap.has(key)) {
        return pendingParamMap.get(key)!;
      }
      const index = pendingParamIndex++;
      pendingParamMap.set(key, index);
      pendingParams.push(value);
      return index;
    };

    if (filters?.school_id) {
      const idx = getPendingParamIndex(filters.school_id);
      pendingConditions.push(`ps.school_id = $${idx}`);
    }

    if (filters?.name) {
      const nameValue = `%${filters.name}%`;
      const idx = getPendingParamIndex(nameValue);
      pendingConditions.push(`ps.full_name ILIKE $${idx}`);
    }

    if (filters?.email) {
      const emailValue = `%${filters.email}%`;
      const idx = getPendingParamIndex(emailValue);
      pendingConditions.push(`ps.email ILIKE $${idx}`);
    }

    return {
      pendingConditions,
      pendingParams,
    };
  }

  /**
   * Helper: Determine which tables to query based on account_status filter
   */
  private shouldIncludeTables(filters?: GetStudentsFilterDto): {
    includeEducations: boolean;
    includePending: boolean;
  } {
    const includeEducations =
      !filters?.account_status ||
      filters.account_status === AccountStatus.JOINED;
    const includePending =
      !filters?.account_status ||
      filters.account_status === AccountStatus.NOT_JOINED;

    return { includeEducations, includePending };
  }

  /**
   * Helper: Build filter conditions for verification_status and account_status
   */
  private buildStatusFilters(
    filters: GetStudentsFilterDto | undefined,
    paramIndex: number,
    params: any[],
  ): { conditions: string[]; nextParamIndex: number } {
    const conditions: string[] = [];
    let nextIndex = paramIndex;

    if (filters?.verification_status) {
      conditions.push(`verification_status = $${nextIndex}`);
      params.push(filters.verification_status);
      nextIndex++;
    }

    if (filters?.account_status) {
      conditions.push(`account_status = $${nextIndex}`);
      params.push(filters.account_status);
      nextIndex++;
    }

    return { conditions, nextParamIndex: nextIndex };
  }

  /**
   * Get students grouped by user_id + major with pagination using UNION + CTE + GROUP BY
   * Each row represents exactly one user (or pending student) with one major.
   * Aggregates student_ids and educations for that (user, major) at database level.
   * Optimized based on account_status filter
   */
  async getStudentsGroupedWithPagination(
    filters?: GetStudentsFilterDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<StudentQueryResultDto[]> {
    const manager = this.userEducationRepository.manager;
    const offset = (page - 1) * limit;

    // Build filter conditions
    const { eduConditions, pendingConditions, params, paramIndex } =
      this.buildFilterConditions(filters);

    // Determine which tables to query
    const { includeEducations, includePending } =
      this.shouldIncludeTables(filters);

    // Early return if no tables to query
    if (!includeEducations && !includePending) {
      return [];
    }

    // Build UNION parts
    const unionParts: string[] = [];

    if (includeEducations) {
      unionParts.push(`
        SELECT 
          ue.student_id,
          ue.user_id,
          ue.id as user_education_id,
          COALESCE(u.full_name, '') as full_name,
          COALESCE(u.photo_url, '') as photo_url,
          COALESCE(u.email, '') as email,
          NULL::text as phone_num,
          COALESCE(mm.major_name, ue.major, '') as major,
          ue.school_id,
          ue.major_id,
          ue.education_degree as degree,
          ue.diploma_level,
          COALESCE(ue.institution_name, '') as institution_name,
          COALESCE(ue.file_url, '') as file_url,
          ue.approval_state,
          ue.created_at,
          CASE 
            WHEN ue.approval_state = 'APPROVED' THEN 'VERIFIED'
            WHEN ue.approval_state = 'WAITING_APPROVAL' THEN 'NEED_VERIFICATION'
            ELSE 'NOT_VERIFIED'
          END as verification_status,
          'JOINED' as account_status
        FROM user_educations ue
        INNER JOIN users u ON ue.user_id = u.id AND u.deleted_at IS NULL
        LEFT JOIN mst_majors mm ON ue.major_id = mm.id
        WHERE ${eduConditions.join(" AND ")}
      `);
    }

    if (includePending) {
      unionParts.push(`
        SELECT 
          ps.student_id,
          u.id as user_id,
          NULL::uuid as user_education_id,
          COALESCE(ps.full_name, '') as full_name,
          COALESCE(ps.photo_url, '') as photo_url,
          COALESCE(ps.email, '') as email,
          COALESCE(ps.phone_num, '') as phone_num,
          COALESCE(mm.major_name, ps.major, '') as major,
          ps.school_id,
          ps.major_id,
          ps.degree,
          ps.diploma_level,
          COALESCE(ms.name, '') as institution_name,
          '' as file_url,
          'WAITING_APPROVAL' as approval_state,
          NULL::timestamp as created_at,
          'EDUCATION_NOT_REGISTERED' as verification_status,
          CASE 
            WHEN u.id IS NOT NULL AND u.deleted_at IS NULL THEN 'JOINED'
            ELSE 'NOT_JOINED'
          END as account_status
        FROM pending_student_verifications ps
        LEFT JOIN mst_schools ms ON ps.school_id = ms.id
        LEFT JOIN mst_majors mm ON ps.major_id = mm.id
        LEFT JOIN users u ON 
          ps.email IS NOT NULL 
          AND TRIM(ps.email) != '' 
          AND LOWER(TRIM(ps.email)) = LOWER(TRIM(u.email)) 
          AND u.deleted_at IS NULL
        WHERE ${pendingConditions.join(" AND ")}
      `);
    }

    // Build status filters
    const { conditions: filterConditions, nextParamIndex } =
      this.buildStatusFilters(filters, paramIndex, params);

    // Build the complete query - return 1 row per education (no grouping)
    const query = `
      WITH combined_data AS (
        ${unionParts.join(" UNION ALL ")}
      ),
      filtered_data AS (
        SELECT 
          student_id,
          user_id,
          user_education_id,
          full_name,
          photo_url,
          email,
          phone_num,
          major,
          school_id,
          major_id,
          degree,
          diploma_level,
          institution_name,
          file_url,
          approval_state,
          created_at,
          verification_status,
          account_status
        FROM combined_data
        ${filterConditions.length > 0 ? "WHERE " + filterConditions.join(" AND ") : ""}
      )
      SELECT 
        user_id,
        ARRAY[student_id] as student_ids,
        full_name,
        photo_url,
        email,
        COALESCE(phone_num, '') as phone_num,
        ARRAY[major] as majors,
        jsonb_build_array(
          jsonb_build_object(
            'student_id', student_id,
            'user_education_id', user_education_id,
            'major', COALESCE(major, ''),
            'degree', degree,
            'diploma_level', diploma_level,
            'institution_name', COALESCE(institution_name, ''),
            'file_url', COALESCE(file_url, ''),
            'approval_state', approval_state,
            'school_id', school_id,
            'major_id', major_id
          )
        ) as educations,
        school_id,
        major_id,
        degree,
        diploma_level,
        verification_status as status,
        account_status
      FROM filtered_data
      ORDER BY 
        CASE 
          WHEN account_status = 'JOINED' THEN created_at 
          ELSE NULL 
        END DESC NULLS LAST,
        COALESCE(user_id::text, student_id),
        major
      ${limit > 0 ? `LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}` : ""}
    `;

    // Only add LIMIT/OFFSET params if limit is positive (limit = -1 means no limit)
    if (limit > 0) {
      params.push(limit);
      params.push(offset);
    }

    return await manager.query(query, params);
  }

  /**
   * Get students with pagination using UNION + CTE
   * Optimized based on account_status filter
   * @deprecated Use getStudentsGroupedWithPagination() instead
   */
  async getStudentsWithPagination(
    filters?: GetStudentsFilterDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<StudentQueryResultDto[]> {
    const manager = this.userEducationRepository.manager;
    const offset = (page - 1) * limit;

    // Build filter conditions
    const { eduConditions, pendingConditions, params, paramIndex } =
      this.buildFilterConditions(filters);

    // Determine which tables to query
    const { includeEducations, includePending } =
      this.shouldIncludeTables(filters);

    // Early return if no tables to query
    if (!includeEducations && !includePending) {
      return [];
    }

    // Build UNION parts
    const unionParts: string[] = [];

    if (includeEducations) {
      unionParts.push(`
        SELECT 
          ue.student_id,
          ue.user_id,
          COALESCE(u.full_name, '') as full_name,
          COALESCE(u.photo_url, '') as photo_url,
          COALESCE(u.email, '') as email,
          NULL::text as phone_num,
          COALESCE(ue.major, '') as major,
          CASE 
            WHEN ue.approval_state = 'APPROVED' THEN 'VERIFIED'
            WHEN ue.approval_state = 'WAITING_APPROVAL' THEN 'NEED_VERIFICATION'
            ELSE 'NOT_VERIFIED'
          END as verification_status,
          'JOINED' as account_status
        FROM user_educations ue
        INNER JOIN users u ON ue.user_id = u.id AND u.deleted_at IS NULL
        WHERE ${eduConditions.join(" AND ")}
      `);
    }

    if (includePending) {
      unionParts.push(`
        SELECT 
          ps.student_id,
          u.id as user_id,
          COALESCE(ps.full_name, '') as full_name,
          COALESCE(ps.photo_url, '') as photo_url,
          COALESCE(ps.email, '') as email,
          COALESCE(ps.phone_num, '') as phone_num,
          COALESCE(ps.major, '') as major,
          'EDUCATION_NOT_REGISTERED' as verification_status,
          CASE 
            WHEN u.id IS NOT NULL AND u.deleted_at IS NULL THEN 'JOINED'
            ELSE 'NOT_JOINED'
          END as account_status
        FROM pending_student_verifications ps
        LEFT JOIN users u ON 
          ps.email IS NOT NULL 
          AND TRIM(ps.email) != '' 
          AND LOWER(TRIM(ps.email)) = LOWER(TRIM(u.email)) 
          AND u.deleted_at IS NULL
        WHERE ${pendingConditions.join(" AND ")}
      `);
    }

    // Build status filters
    const { conditions: filterConditions, nextParamIndex } =
      this.buildStatusFilters(filters, paramIndex, params);

    // Build the complete query with CTE
    const query = `
      WITH combined_data AS (
        ${unionParts.join(" UNION ALL ")}
      ),
      filtered_data AS (
        SELECT *
        FROM combined_data
        ${filterConditions.length > 0 ? "WHERE " + filterConditions.join(" AND ") : ""}
      )
      SELECT 
        student_id,
        user_id,
        full_name,
        photo_url,
        email,
        COALESCE(phone_num, '') as phone_num,
        major,
        verification_status as status,
        account_status
      FROM filtered_data
      ORDER BY student_id
      ${limit > 0 ? `LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}` : ""}
    `;

    // Only add LIMIT/OFFSET params if limit is positive (limit = -1 means no limit)
    if (limit > 0) {
      params.push(limit);
      params.push(offset);
    }

    return await manager.query(query, params);
  }

  /**
   * Get total count of students with same filters (without pagination)
   * Counts distinct grouped keys (user_id + major for JOINED, student_id + major for NOT_JOINED)
   */
  async getStudentsCount(filters?: GetStudentsFilterDto): Promise<number> {
    const manager = this.userEducationRepository.manager;

    // Build filter conditions
    const { eduConditions, pendingConditions, params, paramIndex } =
      this.buildFilterConditions(filters);

    // Determine which tables to query
    const { includeEducations, includePending } =
      this.shouldIncludeTables(filters);

    // Early return if no tables to query
    if (!includeEducations && !includePending) {
      return 0;
    }

    // Build UNION parts
    const unionParts: string[] = [];

    if (includeEducations) {
      unionParts.push(`
        SELECT 
          ue.student_id,
          ue.user_id,
          COALESCE(u.full_name, '') as full_name,
          COALESCE(u.photo_url, '') as photo_url,
          COALESCE(u.email, '') as email,
          NULL::text as phone_num,
          COALESCE(ue.major, '') as major,
          CASE 
            WHEN ue.approval_state = 'APPROVED' THEN 'VERIFIED'
            WHEN ue.approval_state = 'WAITING_APPROVAL' THEN 'NEED_VERIFICATION'
            ELSE 'NOT_VERIFIED'
          END as verification_status,
          'JOINED' as account_status
        FROM user_educations ue
        LEFT JOIN users u ON ue.user_id = u.id
        WHERE ${eduConditions.join(" AND ")}
        AND (u.deleted_at IS NULL OR u.id IS NULL)
      `);
    }

    if (includePending) {
      unionParts.push(`
        SELECT 
          ps.student_id,
          u.id as user_id,
          COALESCE(ps.full_name, '') as full_name,
          COALESCE(ps.photo_url, '') as photo_url,
          COALESCE(ps.email, '') as email,
          COALESCE(ps.phone_num, '') as phone_num,
          COALESCE(ps.major, '') as major,
          'EDUCATION_NOT_REGISTERED' as verification_status,
          CASE 
            WHEN u.id IS NOT NULL AND u.deleted_at IS NULL THEN 'JOINED'
            ELSE 'NOT_JOINED'
          END as account_status
        FROM pending_student_verifications ps
        LEFT JOIN users u ON 
          ps.email IS NOT NULL 
          AND TRIM(ps.email) != '' 
          AND LOWER(TRIM(ps.email)) = LOWER(TRIM(u.email)) 
          AND u.deleted_at IS NULL
        WHERE ${pendingConditions.join(" AND ")}
      `);
    }

    // Build status filters
    const { conditions: filterConditions } = this.buildStatusFilters(
      filters,
      paramIndex,
      params,
    );

    // Build count query - count each education as separate row (no grouping)
    const query = `
      WITH combined_data AS (
        ${unionParts.join(" UNION ALL ")}
      ),
      filtered_data AS (
        SELECT 
          student_id,
          user_id,
          full_name,
          photo_url,
          email,
          phone_num,
          major,
          verification_status,
          account_status
        FROM combined_data
        ${filterConditions.length > 0 ? "WHERE " + filterConditions.join(" AND ") : ""}
      )
      SELECT COUNT(*) as total
      FROM filtered_data
    `;

    const result = await manager.query(query, params);
    return parseInt(result[0]?.total || "0", 10);
  }

  /**
   * Helper: Count educations with filters
   */
  private async countEducations(
    manager: EntityManager,
    filters?: GetStudentsFilterDto,
  ): Promise<number> {
    // account_status filter: if NOT_JOINED, return 0 (educations are always JOINED)
    if (filters?.account_status === AccountStatus.NOT_JOINED) {
      return 0;
    }

    // verification_status filter: if EDUCATION_NOT_REGISTERED, return 0 (doesn't exist in educations)
    if (filters?.verification_status === "EDUCATION_NOT_REGISTERED") {
      return 0;
    }

    const {
      eduConditions,
      params: baseParams,
      paramIndex: baseParamIndex,
    } = this.buildFilterConditions(filters);

    const params: any[] = [...baseParams];
    let paramIndex = baseParamIndex;

    // Add verification_status filter if provided
    if (filters?.verification_status) {
      const statusMap: Record<string, string> = {
        VERIFIED: "APPROVED",
        NEED_VERIFICATION: "WAITING_APPROVAL",
        NOT_VERIFIED: "REJECT",
      };
      const approvalState = statusMap[filters.verification_status];
      if (approvalState) {
        eduConditions.push(`ue.approval_state = $${paramIndex}`);
        params.push(approvalState);
        paramIndex++;
      }
    }

    const query = `
      SELECT COUNT(*) as total
      FROM user_educations ue
      LEFT JOIN users u ON ue.user_id = u.id
      WHERE ${eduConditions.join(" AND ")}
      AND (u.deleted_at IS NULL OR u.id IS NULL)
    `;

    const result = await manager.query(query, params);
    return parseInt(result[0]?.total || "0", 10);
  }

  /**
   * Helper: Count pending with filters
   */
  private async countPending(
    manager: EntityManager,
    filters?: GetStudentsFilterDto,
  ): Promise<number> {
    // account_status filter: if JOINED, return 0 (pending is always NOT_JOINED)
    if (filters?.account_status === AccountStatus.JOINED) {
      return 0;
    }

    // verification_status filter: if not EDUCATION_NOT_REGISTERED, return 0 (pending only has EDUCATION_NOT_REGISTERED)
    if (
      filters?.verification_status &&
      filters.verification_status !== "EDUCATION_NOT_REGISTERED"
    ) {
      return 0;
    }

    const { pendingConditions, pendingParams } =
      this.buildPendingFilterConditions(filters);

    const query = `
      SELECT COUNT(*) as total
      FROM pending_student_verifications ps
      WHERE ${pendingConditions.join(" AND ")}
    `;

    const result = await manager.query(query, pendingParams);
    return parseInt(result[0]?.total || "0", 10);
  }
}
