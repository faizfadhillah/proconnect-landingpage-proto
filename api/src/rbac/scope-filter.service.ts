import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, SelectQueryBuilder } from "typeorm";
import { Rbac, RbacType } from "./entities/rbac.entity";
import { UserRoleAssignmentService } from "../user_role_assignments/services/user_role_assignments.service";
import { ScopeInfo, PermissionMeta, PermissionScopeInfo } from "./interfaces/scope-info.interface";
import { LoggingService } from "../logs/logs.service";
import { UserRoleAssignmentRole } from "src/user_role_assignments/enums/user_role_assignment.enums";
import { CompanyDepartmentMap } from "src/company_department_map/entities/company_department_map.entity";
import { ScopeFilterDao } from "./dao/scope-filter.dao";
import { PermissionName } from "./rbac.constants";

@Injectable()
export class ScopeFilterService {
  constructor(
    @InjectRepository(Rbac)
    private readonly rbacRepository: Repository<Rbac>,
    @Inject(forwardRef(() => UserRoleAssignmentService))
    private readonly userRoleAssignmentService: UserRoleAssignmentService,
    private readonly logger: LoggingService,
    private readonly scopeFilterDao: ScopeFilterDao
  ) { }

  /**
   * Get scope information for a user based on their role assignments and permissions
   * @param userId - The user ID
   * @returns ScopeInfo object containing level, branch_scope, dept_scope, and IDs
   */
  async getScopeInfo(userId: string): Promise<ScopeInfo> {
    this.logger.debug(`Getting scope info for user ${userId}`);

    // Default to most restrictive scope
    const scopeInfo: ScopeInfo = {
      companyHqIds: [],
      companyIds: [],
      deptIds: [],
      isSysAdmin: false,
      isCandidate: false,
      userId: userId,
      permissionScopes: []
    };

    const activeAssignments = await this.userRoleAssignmentService.getActiveByUserId(userId);
    if (activeAssignments.length === 0) {
      this.logger.debug('No active role assignments found, returning default scope');
      return scopeInfo;
    }

    const roles = activeAssignments.map(assignment => assignment.role);

    // Check if user is candidate
    const isCandidate = roles.includes(UserRoleAssignmentRole.CANDIDATE);
    scopeInfo.isCandidate = isCandidate;

    // Check if user is sys_admin or admin_viewer (no restrictions)
    if (roles.includes(UserRoleAssignmentRole.SYS_ADMIN) || roles.includes(UserRoleAssignmentRole.ADMIN_VIEWER)) {
      this.logger.debug('User is sys_admin or admin_viewer, granting full access');
      scopeInfo.isSysAdmin = true;
      return scopeInfo;
    }

    // Extract distinct company roles and roles from assignments
    const parent_roles = [
      ...new Set(
        activeAssignments
          .map(assignment => assignment.role)
          .filter(role => role !== null && role !== undefined)
      ),
      ...new Set(
        activeAssignments
          .map(assignment => assignment.company_role)
          .filter(role => role !== null && role !== undefined)
      ),
    ];
    this.logger.debug(`Distinct parent roles: ${parent_roles.join(', ')}`);
    if (parent_roles.length === 0) {
      this.logger.debug('No parent roles found, returning default scope');
      return scopeInfo;
    }

    // Store assignments in scopeInfo to avoid multiple DB queries
    scopeInfo.assignments = activeAssignments.map(assignment => ({
      company_role: assignment.company_role,
      role: assignment.role,
      company_id: assignment.company_id,
      company_hq_id: assignment.company_hq_id,
      dept_id: assignment.dept_id,
    }));

    // Populate hq_ids, company_ids, and dept_ids from assignments
    const hq_ids = new Set<string>();
    const company_ids = new Set<string>();
    const dept_ids = new Set<string>();
    activeAssignments.forEach(assignment => {
      if (assignment.company_hq_id) hq_ids.add(assignment.company_hq_id);
      if (assignment.company_id) company_ids.add(assignment.company_id);
      if (assignment.dept_id) dept_ids.add(assignment.dept_id);
    });
    scopeInfo.companyHqIds = Array.from(hq_ids);
    scopeInfo.companyIds = Array.from(company_ids);
    scopeInfo.deptIds = Array.from(dept_ids);

    // Get permissions for each company role from RBAC
    const permissions = await this.rbacRepository.find({
      where: {
        type: RbacType.permission,
        parent_role: In(parent_roles)
      }
    });
    this.logger.debug(`Found ${permissions.length} permissions for company roles`);

    // Populate permission scopes
    const permissionScopes = this.extractScopeFromPermissions(permissions);

    this.logger.debug(`Extracted scope data: ${JSON.stringify(permissionScopes)}`);
    scopeInfo.permissionScopes = permissionScopes;

    return scopeInfo;
  }

  /**
   * Aggregate the most permissive scope across provided permission names
   */
  private aggregatePermissions(
    permissionNames: string[],
    permissionScopes: PermissionScopeInfo[],
  ): {
    hasHqLevel: boolean;
    hasBranchLevel: boolean;
    hasDeptLevel: boolean;
    hasBranchScopeSelf: boolean;
    hasDeptScopeSelf: boolean;
  } {
    let hasHqLevel = false;
    let hasBranchLevel = false;
    let hasDeptLevel = false;
    let hasBranchScopeSelf = false;
    let hasDeptScopeSelf = false;

    for (const permissionName of permissionNames) {
      const scope = permissionScopes.find(s => s.permission_name === permissionName);
      if (!scope) continue;

      if (scope.level === 'hq') hasHqLevel = true;
      else if (scope.level === 'branch') hasBranchLevel = true;
      else if (scope.level === 'dept') hasDeptLevel = true;

      if (scope.branch_scope === 'self') hasBranchScopeSelf = true;

      if (scope.dept_scope === 'self') hasDeptScopeSelf = true;
    }

    return {
      hasHqLevel,
      hasBranchLevel,
      hasDeptLevel,
      hasBranchScopeSelf,
      hasDeptScopeSelf,
    };
  }

  /**
   * Extract scope information from permissions meta data
   */
  private extractScopeFromPermissions(
    permissions: Rbac[],
  ): PermissionScopeInfo[] {
    const scopeResult: Map<string, PermissionScopeInfo> = new Map();

    // Process each permission's meta data
    for (const permission of permissions) {
      if (!permission.meta) {
        this.logger.warn(`Permission ${permission.name} has no meta data`);
        continue;
      };

      try {
        const meta: PermissionMeta = typeof permission.meta === 'string'
          ? JSON.parse(permission.meta)
          : permission.meta;
        const currentPermissionScope = scopeResult.get(permission.name);

        if (!currentPermissionScope) {
          scopeResult.set(permission.name, {
            permission_name: permission.name,
            level: meta.level,
            branch_scope: meta.branch_scope,
            dept_scope: meta.dept_scope,
          });
          continue;
        }

        // Update level (most permissive wins)
        if (meta.level) {
          if (meta.level === 'hq' ||
            (meta.level === 'branch' && scopeResult.get(permission.name)?.level !== 'hq') ||
            (meta.level === 'dept' && scopeResult.get(permission.name)?.level === 'self')) {
            currentPermissionScope.level = meta.level;
            scopeResult.set(permission.name, currentPermissionScope);
          }
        }

        // Update branch scope (most permissive wins)
        if (meta.branch_scope === 'all') {
          currentPermissionScope.branch_scope = 'all';
          scopeResult.set(permission.name, currentPermissionScope);
        }

        // Update department scope (most permissive wins)
        if (meta.dept_scope === 'all') {
          currentPermissionScope.dept_scope = 'all';
          scopeResult.set(permission.name, currentPermissionScope);
        }
      } catch (error) {
        this.logger.warn(`Failed to parse permission meta for ${permission.name}: ${error.message}`);
      }
    }

    return Array.from(scopeResult.values());
  }

  // level:
  // hq bisa liat semua branch dan semua dept
  // branch bisa liat branch itu dan all dept
  // dept bisa dept itu aja. 

  private checkDeptScope(checkDeptId: string,
    assignedDeptIds: string[],
    companyDeptMapping: CompanyDepartmentMap[]): boolean {
    if (!companyDeptMapping.find(map => map.dept_id === checkDeptId)) {
      return false;
    }

    // cannot access dept that not assigned
    if (!assignedDeptIds.includes(checkDeptId)) {
      return false;
    }

    return true;
  }

  private checkCompanyScope(
    checkCompanyId: string,
    checkDeptId: string,
    assignedCompanyIds: string[],
    companyDeptMapping: CompanyDepartmentMap[]): boolean {
    if (!companyDeptMapping.find(map => map.company_id === checkCompanyId)) {
      return false;
    }

    // cannot access company that not assigned
    if (!assignedCompanyIds.includes(checkCompanyId)) {
      return false;
    }

    // cannot access dept that not under assigned company
    const assignedDeptIds = companyDeptMapping.filter(map => map.company_id === checkCompanyId).map(map => map.dept_id);
    if (!assignedDeptIds.includes(checkDeptId)) {
      return false;
    }

    return true;
  }

  private checkHqScope(checkHqId: string,
    checkCompanyId: string,
    checkDeptId: string,
    assignedHqIds: string[],
    companyDeptMapping: CompanyDepartmentMap[]): boolean {
    if (!companyDeptMapping.find(map => map.company_hq_id === checkHqId)) {
      return false;
    }

    // cannot access hq that not assigned
    if (!assignedHqIds.includes(checkHqId)) {
      return false;
    }

    // cannot access company that not under assigned hq
    const assignedCompanyIds = companyDeptMapping.filter(map => map.company_hq_id === checkHqId).map(map => map.company_id);
    if (!assignedCompanyIds.includes(checkCompanyId)) {
      return false;
    }

    // cannot access dept that not under assigned company
    const assignedDeptIds = companyDeptMapping.filter(map => map.company_id === checkCompanyId).map(map => map.dept_id);
    if (!assignedDeptIds.includes(checkDeptId)) {
      return false;
    }

    return true;
  }

  hasAccess(
    scopeInfo: ScopeInfo,
    permissionName: PermissionName,
    companyDeptMapping: CompanyDepartmentMap[],
    resourceCompanyHqId?: string,
    resourceCompanyId?: string,
    resourceDeptId?: string,
  ): boolean {
    // Sys admin has access to everything
    if (scopeInfo.isSysAdmin) {
      return true;
    }

    const permissionScope = scopeInfo.permissionScopes.find(scope => scope.permission_name === permissionName);
    if (!permissionScope) {
      return false;
    }

    if (permissionScope.level === 'public') {
      return true;
    }

    // check by branch scope
    if (permissionScope.branch_scope) {
      if (permissionScope.branch_scope === 'all') {
        return this.checkHqScope(
          resourceCompanyHqId,
          resourceCompanyId,
          resourceDeptId,
          scopeInfo.companyHqIds,
          companyDeptMapping
        )
      }

      return this.checkCompanyScope(
        resourceCompanyId,
        resourceDeptId,
        scopeInfo.companyIds,
        companyDeptMapping
      )
    }

    // check by dept scope
    if (permissionScope.dept_scope) {
      if (permissionScope.dept_scope === 'all') {
        return this.checkCompanyScope(
          resourceCompanyId,
          resourceDeptId,
          scopeInfo.companyIds,
          companyDeptMapping
        )
      }

      return this.checkDeptScope(
        resourceDeptId,
        scopeInfo.deptIds,
        companyDeptMapping
      )
    }

    // check by level
    if (permissionScope.level === 'hq') {
      return this.checkHqScope(
        resourceCompanyHqId,
        resourceCompanyId,
        resourceDeptId,
        scopeInfo.companyHqIds,
        companyDeptMapping
      )
    }

    if (permissionScope.level === 'branch') {
      return this.checkCompanyScope(
        resourceCompanyId,
        resourceDeptId,
        scopeInfo.companyIds,
        companyDeptMapping
      )
    }

    if (permissionScope.level === 'dept') {
      return this.checkDeptScope(
        resourceDeptId,
        scopeInfo.deptIds,
        companyDeptMapping
      )
    }

    return true;
  }

  /**
   * Filter assignments by permission: only include assignments where the role has the required permissions
   * @param assignments Array of assignments to filter
   * @param permissionNames Array of permission names to check
   * @returns Filtered assignments that have roles with the required permissions
   */
  private async filterAssignmentsByPermissions(
    assignments: ScopeInfo['assignments'],
    permissionNames: string[]
  ): Promise<ScopeInfo['assignments']> {
    if (!assignments || assignments.length === 0) {
      return [];
    }

    // Query RBAC to find roles that have the required permissions
    const permissions = await this.rbacRepository.find({
      where: {
        type: RbacType.permission,
        name: In(permissionNames)
      },
      select: ['parent_role']
    });

    const allowedRoles = new Set(permissions.map(p => p.parent_role));

    // Filter assignments that have roles with the required permissions
    return assignments.filter(assignment => {
      const role = assignment.company_role || assignment.role;
      return allowedRoles.has(role);
    });
  }

  /**
   * Get available company IDs for multiple permissions (most permissive wins)
   * @param scopeInfo User's scope information
   * @param permissionNames Array of permission names to check
   * @returns Array of unique company IDs based on highest permission level
   */
  async getAvailableCompanyIdsForPermissions(scopeInfo: ScopeInfo, permissionNames: string[]): Promise<string[]> {
    if (scopeInfo.isSysAdmin) {
      return [];
    }

    const filteredAssignments = await this.filterAssignmentsByPermissions(scopeInfo.assignments, permissionNames);
    if (filteredAssignments.length === 0) {
      return [];
    }

    // Extract companyIds and companyHqIds from filtered assignments
    const filteredCompanyIds = new Set<string>();
    const filteredCompanyHqIds = new Set<string>();
    filteredAssignments.forEach(assignment => {
      if (assignment.company_id) filteredCompanyIds.add(assignment.company_id);
      if (assignment.company_hq_id) filteredCompanyHqIds.add(assignment.company_hq_id);
    });

    const {
      hasHqLevel,
      hasBranchScopeSelf,
    } = this.aggregatePermissions(permissionNames, scopeInfo.permissionScopes);

    // Make single DB call based on most permissive scope
    if (hasHqLevel) {
      if (hasBranchScopeSelf) {
        return Array.from(filteredCompanyIds);
      }

      // HQ level always sees all companies under HQ (HQ + all branches)
      return this.scopeFilterDao.getCompanyIdsByHqIds(Array.from(filteredCompanyHqIds));
    }

    // Branch or dept level - use assigned companies from filtered assignments
    return Array.from(filteredCompanyIds);
  }

  /**
   * Get available department IDs for multiple permissions (most permissive wins)
   * @param scopeInfo User's scope information
   * @param permissionNames Array of permission names to check
   * @returns Array of unique department IDs based on highest permission level
   *
   * Note: For HQ and Branch level, we need to include NULL dept along with assigned depts
   *       This requires special handling in the DAO layer
   */
  async getAvailableDeptIdsForPermissions(scopeInfo: ScopeInfo, permissionNames: string[]): Promise<string[]> {
    if (scopeInfo.isSysAdmin) {
      return [];
    }

    const filteredAssignments = await this.filterAssignmentsByPermissions(scopeInfo.assignments, permissionNames);
    if (filteredAssignments.length === 0) {
      return [];
    }

    // Extract deptIds, companyIds, and companyHqIds from filtered assignments
    const filteredDeptIds = new Set<string>();
    const filteredCompanyIds = new Set<string>();
    const filteredCompanyHqIds = new Set<string>();
    filteredAssignments.forEach(assignment => {
      if (assignment.dept_id) filteredDeptIds.add(assignment.dept_id);
      if (assignment.company_id) filteredCompanyIds.add(assignment.company_id);
      if (assignment.company_hq_id) filteredCompanyHqIds.add(assignment.company_hq_id);
    });

    const {
      hasHqLevel,
      hasBranchLevel,
      hasDeptScopeSelf,
      hasBranchScopeSelf,
    } = this.aggregatePermissions(permissionNames, scopeInfo.permissionScopes);

    // Make single DB call based on most permissive scope
    if (hasHqLevel) {
      if (hasDeptScopeSelf) {
        return Array.from(filteredDeptIds);
      }

      if (hasBranchScopeSelf) {
        return this.scopeFilterDao.getDeptIdsByCompanyIds(Array.from(filteredCompanyIds));
      }

      // HQ with all branch scope - fetch all depts under HQ's companies
      const companyIds = await this.scopeFilterDao.getCompanyIdsByHqIds(Array.from(filteredCompanyHqIds));
      return this.scopeFilterDao.getDeptIdsByCompanyIds([
        ...new Set([...Array.from(filteredCompanyHqIds), ...companyIds])
      ]);
    }

    if (hasBranchLevel) {
      if (hasDeptScopeSelf) {
        return Array.from(filteredDeptIds);
      }

      return this.scopeFilterDao.getDeptIdsByCompanyIds(Array.from(filteredCompanyIds));
    }

    // Dept level
    return Array.from(filteredDeptIds);
  }

  /**
   * Apply school scope for PIC_SCHOOL users
   */
  async applySchoolScope(
    query: SelectQueryBuilder<any>,
    user: { id: string },
    tableName: string
  ): Promise<SelectQueryBuilder<any>> {
    // Check if user is PIC_SCHOOL
    const isPicSchool = await this.userRoleAssignmentService.isUserPicSchool(user.id);
    
    if (isPicSchool) {
      // Get user's assigned schools
      const assignedSchools = await this.userRoleAssignmentService.getUserAssignedSchools(user.id);
      
      if (assignedSchools.length > 0) {
        // Filter by school_id
        query.andWhere(`${tableName}.school_id IN (:...schoolIds)`, {
          schoolIds: assignedSchools
        });
      } else {
        // No schools assigned, return empty result
        query.andWhere('1 = 0');
      }
    }
    
    return query;
  }
}