import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, In, Brackets, SelectQueryBuilder, WhereExpressionBuilder } from 'typeorm';
import { UserRoleAssignmentHistory } from '../entities/user_role_assignment_history.entity';
import { UserRoleAssignmentStatus } from '../enums/user_role_assignment.enums';
import { ScopeFilterService } from 'src/rbac/scope-filter.service';
import { PermissionName } from 'src/rbac/rbac.constants';
import { LoggingService } from 'src/logs/logs.service';

@Injectable()
export class UserRoleAssignmentHistoryDao {
  constructor(
    @InjectRepository(UserRoleAssignmentHistory)
    private historyRepository: Repository<UserRoleAssignmentHistory>,
    private readonly scopeFilterService: ScopeFilterService,
    private readonly logger: LoggingService,
  ) { }

  /**
   * Find history records by user ID (latest per combination)
   */
  async findHistoryByUserId(userId: string, page?: number, limit?: number): Promise<UserRoleAssignmentHistory[]> {
    let query = this.historyRepository.createQueryBuilder('history')
      .leftJoinAndSelect('history.roleAssignment', 'roleAssignment')
      .where('history.userId = :userId', { userId })
      .orderBy('COALESCE(history.start_date, history.created_at)', 'DESC');

    if (page && limit && limit > 0) {
      query = query.skip((page - 1) * limit).take(limit);
    }

    return query.getMany();
  }

  /**
   * Find detailed history records by user ID with joined relations and selected fields
   */
  async findDetailedHistoryByUserId(userId: string, page?: number, limit?: number): Promise<any[]> {
    let query = this.historyRepository.createQueryBuilder('history')
      .leftJoin('history.roleAssignment', 'roleAssignment')
      .leftJoin('history.user', 'user')
      .leftJoin('history.company', 'company')
      .leftJoin('history.department', 'department')
      .leftJoin('history.profession', 'profession')
      .select([
        'history.id as role_assignment_history_id',
        'history.roleAssignmentId as role_assignment_id',
        'history.userId as user_id',
        'history.companyHqId as company_hq_id',
        'history.companyId as company_id',
        'history.deptId as dept_id',
        'history.companyRole as company_role',
        'history.role as role',
        'history.schoolId as school_id',
        'history.startDate as start_date',
        'history.endDate as end_date',
        'history.status as status',
        'history.employmentType as employment_type',
        'history.professionId as profession_id',
        'history.created_at as created_at',
        'history.updated_at as updated_at',
        'history.created_by as created_by',
        'history.updated_by as updated_by',
        // User data
        'user.full_name as full_name',
        'user.email as email',
        'user.photo_url as photo_url',
        // Company data
        'company.branch as branch',
        'company.company_name as company_name',
        // Department data
        'department.dept_name as dept_name',
        // Profession data
        'profession.name as profession_name',
      ])
      .where('history.userId = :userId', { userId })
      .orderBy('COALESCE(history.start_date, history.created_at)', 'DESC');

    if (page && limit && limit > 0) {
      query = query.offset((page - 1) * limit).limit(limit);
    }

    return query.getRawMany();
  }

  /**
   * Count history records by user ID
   */
  async countHistoryByUserId(userId: string): Promise<number> {
    return this.historyRepository.count({
      where: { userId },
    });
  }

  /**
   * Find history records by IDs
   */
  async findByIds(historyIds: string[], manager?: EntityManager): Promise<UserRoleAssignmentHistory[]> {
    const repo = manager ? manager.getRepository(UserRoleAssignmentHistory) : this.historyRepository;
    return repo.find({
      where: { id: In(historyIds) },
      relations: ['roleAssignment'],
    });
  }

  async findByUserId(userId: string, manager?: EntityManager): Promise<UserRoleAssignmentHistory[]> {
    const repo = manager ? manager.getRepository(UserRoleAssignmentHistory) : this.historyRepository;
    const query = repo.createQueryBuilder('history')
      .where('history.userId = :userId', { userId });

    return query.getMany();
  }

  async findByUserIdAndCompany(
    userId: string,
    companyHqId: string | null,
    companyId: string | null
  ): Promise<UserRoleAssignmentHistory[]> {
    const query = this.historyRepository.createQueryBuilder('history')
      .where('history.userId = :userId', { userId });

    if (companyHqId) {
      query.andWhere('history.companyHqId = :companyHqId', { companyHqId });
    }

    if (companyId) {
      query.andWhere('history.companyId = :companyId', { companyId });
    }

    return query.getMany();
  }

  /**
   * Upsert history record (insert or update based on combination uniqueness)
   */
  async upsertHistory(
    historyData: Partial<UserRoleAssignmentHistory>,
    manager?: EntityManager
  ): Promise<UserRoleAssignmentHistory> {
    const repo = manager ? manager.getRepository(UserRoleAssignmentHistory) : this.historyRepository;

    // Try to find existing record by combination
    const existing = await repo.findOne({
      where: {
        userId: historyData.userId,
        companyHqId: historyData.companyHqId || null,
        companyId: historyData.companyId || null,
        deptId: historyData.deptId || null,
      },
    });

    if (existing) {
      // Update existing record
      await repo.update(existing.id, historyData);
      return repo.findOne({ where: { id: existing.id } });
    } else {
      // Create new record
      const entity = repo.create(historyData);
      return repo.save(entity);
    }
  }

  /**
   * Delete history records by IDs
   */
  async deleteByIds(historyIds: string[], manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(UserRoleAssignmentHistory) : this.historyRepository;
    await repo.delete(historyIds);
  }

  /**
   * Check for existing combinations in database
   */
  async findExistingCombinations(
    combinations: Array<{
      userId: string;
      companyHqId: string | null;
      companyId: string | null;
      deptId: string | null;
    }>,
    manager?: EntityManager
  ): Promise<UserRoleAssignmentHistory[]> {
    const repo = manager ? manager.getRepository(UserRoleAssignmentHistory) : this.historyRepository;

    if (combinations.length === 0) {
      return [];
    }

    // Use a simpler approach with individual queries for each combination
    const existingRecords: UserRoleAssignmentHistory[] = [];

    for (const combo of combinations) {
      const existing = await repo.findOne({
        where: {
          userId: combo.userId,
          companyHqId: combo.companyHqId,
          companyId: combo.companyId,
          deptId: combo.deptId,
        },
      });

      if (existing) {
        existingRecords.push(existing);
      }
    }

    return existingRecords;
  }

  /**
   * Update history record
   */
  async updateHistory(
    historyId: string,
    updateData: Partial<UserRoleAssignmentHistory>,
    manager?: EntityManager
  ): Promise<UserRoleAssignmentHistory> {
    const repo = manager ? manager.getRepository(UserRoleAssignmentHistory) : this.historyRepository;
    await repo.update(historyId, updateData);
    return repo.findOne({ where: { id: historyId } });
  }

  /**
   * Check if department is used in any active assignments
   */
  async isDepartmentUsedInAssignments(deptId: string): Promise<boolean> {
    const history = await this.historyRepository.findOne({
      where: {
        deptId,
      },
    });

    return history !== null;
  }
  /**
   * Apply common filters to query builder for company-based history queries
   */
  private applyCompanyFilters(
    query: SelectQueryBuilder<UserRoleAssignmentHistory>,
    companyId?: string,
    companyHqId?: string,
    companyRole?: string,
    deptId?: string,
    name?: string,
    email?: string,
    status?: string,
  ): void {
    // Company filtering (at least one must be provided)
    if (companyId && companyHqId) {
      query.andWhere('(history.companyId = :companyId AND history.companyHqId = :companyHqId)', {
        companyId,
        companyHqId,
      });
    } else if (companyId) {
      query.andWhere('history.companyId = :companyId', { companyId });
    } else if (companyHqId) {
      query.andWhere('history.companyHqId = :companyHqId', { companyHqId });
    }

    // Status filtering
    if (status) {
      query.andWhere('history.status = :status', { status });
    }

    // Additional filters
    if (deptId) {
      query.andWhere('history.deptId = :deptId', { deptId: deptId });
    }

    if (companyRole) {
      query.andWhere('history.companyRole = :companyRole', { companyRole: companyRole });
    }

    // User name and email filters
    if (name && email) {
      query.andWhere(new Brackets((qb: WhereExpressionBuilder) => {
        qb.where('user.full_name ILIKE :name', { name: `%${name}%` })
          .orWhere('user.email ILIKE :email', { email: `%${email}%` });
      }));
    } else if (name) {
      query.andWhere('user.full_name ILIKE :name', { name: `%${name}%` });
    } else if (email) {
      query.andWhere('user.email ILIKE :email', { email: `%${email}%` });
    }
  }

  /**
   * Find detailed history records by company with filtering and pagination
   */
  async findDetailedHistoryByCompany(
    companyId?: string,
    companyHqId?: string,
    companyRole?: string,
    deptId?: string,
    name?: string,
    email?: string,
    status?: string,
    page?: number,
    limit?: number,
    userId?: string,
  ): Promise<any[]> {
    const query = this.historyRepository.createQueryBuilder('history')
      .leftJoin('history.roleAssignment', 'roleAssignment')
      .leftJoin('history.user', 'user')
      .leftJoin('history.company', 'company')
      .leftJoin('history.department', 'department')
      .leftJoin('history.profession', 'profession')
      .leftJoin('user.encryptedUserData', 'encryptedUserData')
      .select([
        'history.id as role_assignment_history_id',
        'history.roleAssignmentId as role_assignment_id',
        'history.userId as user_id',
        'history.companyHqId as company_hq_id',
        'history.companyId as company_id',
        'history.deptId as dept_id',
        'history.companyRole as company_role',
        'history.role as role',
        'history.schoolId as school_id',
        'history.startDate as start_date',
        'history.endDate as end_date',
        'history.status as status',
        'history.employmentType as employment_type',
        'history.professionId as profession_id',
        'history.created_at as created_at',
        'history.updated_at as updated_at',
        'history.created_by as created_by',
        'history.updated_by as updated_by',
        // User data
        'user.full_name as full_name',
        'user.email as email',
        'user.photo_url as photo_url',
        // Encrypted user data
        'encryptedUserData.encrypted_date_of_birth as encrypted_date_of_birth',
        'encryptedUserData.encrypted_nik as encrypted_nik',
        'encryptedUserData.encrypted_phone as encrypted_phone',
        'encryptedUserData.encrypted_address as encrypted_address',
        // Company data
        'company.branch as branch',
        'company.company_name as company_name',
        // Department data
        'department.dept_name as dept_name',
        // Profession data
        'profession.name as profession_name',
      ]);

    // Apply scope filtering first
    await this.applyScopeFilters(query, userId);

    // Apply common filters
    this.applyCompanyFilters(query, companyId, companyHqId, companyRole, deptId, name, email, status);

    // Apply ordering
    query
      .orderBy(`
        CASE
          WHEN history.company_role = 'owner_hq' THEN 1
          ELSE 2
        END
      `, 'ASC')
      .addOrderBy('history.created_at', 'DESC');

    // Apply pagination if provided and limit is positive
    if (page && limit && limit > 0) {
      query.offset((page - 1) * limit).limit(limit);
    }

    return query.getRawMany();
  }

  /**
   * Count detailed history records by company with filtering
   */
  async countDetailedHistoryByCompany(
    companyId?: string,
    companyHqId?: string,
    companyRole?: string,
    deptId?: string,
    name?: string,
    email?: string,
    status?: string,
    userId?: string,
  ): Promise<number> {
    const query = this.historyRepository.createQueryBuilder('history')
      .leftJoin('history.roleAssignment', 'roleAssignment')
      .leftJoin('history.user', 'user')
      .select('COUNT(history.id)', 'count');

    // Apply scope filtering first
    await this.applyScopeFilters(query, userId);

    // Apply common filters
    this.applyCompanyFilters(query, companyId, companyHqId, companyRole, deptId, name, email, status);

    const result = await query.getRawOne();
    return parseInt(result.count) || 0;
  }

  /**
   * Apply scope filters to query based on user's scope
   * @param query The query builder to apply filters to
   * @param userId The user ID to get scope for
   * @returns Updated query with scope filters applied
   */
  private async applyScopeFilters(query: SelectQueryBuilder<any>, userId?: string): Promise<void> {
    if (!userId) {
      return;
    }

    const scopeInfo = await this.scopeFilterService.getScopeInfo(userId);

    if (scopeInfo.isSysAdmin) {
      return;
    }

    const requiredPermissions = [
      PermissionName.TEAM_MGMT_VIEW,
      PermissionName.VIEW_PROFILE_ORG_OVERVIEW_VIEW
    ];

    const companyIds = await this.scopeFilterService.getAvailableCompanyIdsForPermissions(scopeInfo, requiredPermissions);
    const deptIds = await this.scopeFilterService.getAvailableDeptIdsForPermissions(scopeInfo, requiredPermissions);

    // If user doesn't have any assignments with the required permissions, do nothing
    if (companyIds.length === 0 && deptIds.length === 0) {
      return;
    }

    // Apply company scope
    if (companyIds.length > 0) {
      query.andWhere('history.companyId IN (:...companyIds)', { companyIds });
    }

    // Apply HQ scope
    if (scopeInfo.companyHqIds.length > 0) {
      query.andWhere('history.companyHqId IN (:...companyHqIds)', { companyHqIds: scopeInfo.companyHqIds });
    }

    // Apply department scope with NULL handling based on scope level
    // For HQ and Branch scope: include NULL departments along with assigned departments
    // For Department scope: only include assigned departments (no NULL)
    if (deptIds && deptIds.length > 0) {
      // Check if user has HQ or Branch level permissions
      const hasHqOrBranchLevel = scopeInfo.permissionScopes.some(scope =>
        scope.level === 'hq' || scope.level === 'branch'
      );
      
      if (hasHqOrBranchLevel) {
        // HQ or Branch scope: include NULL departments
        query.andWhere('(history.deptId IN (:...deptIds) OR history.deptId IS NULL)', { deptIds });
      } else {
        // Department scope: only assigned departments (no NULL)
        query.andWhere('history.deptId IN (:...deptIds)', { deptIds });
      }
    }
  }

  /**
   * Count distinct users by company with filtering
   */
  async countDistinctUsersByCompany(
    companyId?: string,
    companyHqId?: string,
    companyRole?: string,
    deptId?: string,
    name?: string,
    email?: string,
    status?: string,
    userId?: string,
  ): Promise<number> {
    const query = this.historyRepository.createQueryBuilder('history')
      .leftJoin('history.roleAssignment', 'roleAssignment')
      .leftJoin('history.user', 'user')
      .select('COUNT(DISTINCT history.userId)', 'count');

    // Apply scope filtering first
    await this.applyScopeFilters(query, userId);

    // Apply common filters
    this.applyCompanyFilters(query, companyId, companyHqId, companyRole, deptId, name, email, status);

    const result = await query.getRawOne();
    return parseInt(result.count) || 0;
  }

  /**
   * Check if company and department are assigned (returns true if at least one assignment exists)
   */
  async isCompanyDeptAssigned(companyId: string, deptId: string): Promise<boolean> {
    const res = await this.historyRepository.createQueryBuilder('history')
      .select('history.id', 'id')
      .where('history.companyId = :companyId', { companyId })
      .andWhere('history.deptId = :deptId', { deptId })
      .limit(1)
      .getRawOne();

    return res && res.id !== null && res.id !== undefined;
  }

  /**
   * Check if company has any assignments with null dept_id (returns true if at least one assignment exists)
   */
  async isCompanyAssigned(companyId: string): Promise<boolean> {
    const res = await this.historyRepository.createQueryBuilder('history')
      .select('history.id', 'id')
      .where('history.companyId = :companyId', { companyId })
      .limit(1)
      .getRawOne();

    return res && res.id !== null && res.id !== undefined;
  }

  /**
   * Get distinct user IDs by role (only active assignments)
   * @param role The role to filter by
   * @returns Array of distinct user IDs
   */
  async getUserIdsByRole(role: string): Promise<string[]> {
    const results = await this.historyRepository.createQueryBuilder('history')
      .select('history.userId', 'userId')
      .where('history.role = :role', { role })
      .andWhere('history.status = :status', { status: UserRoleAssignmentStatus.ACTIVE })
      .distinct(true)
      .getRawMany();

    return results.map(result => result.userId).filter(id => id !== null && id !== undefined);
  }
}
