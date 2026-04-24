import { Injectable, BadRequestException, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { UserRoleAssignmentStatus, UserRoleAssignmentRole, UserRoleAssignmentCompanyRole } from '../enums/user_role_assignment.enums';
import { UserRoleAssignmentDao } from '../dao/user_role_assignment.dao';
import { UserRoleAssignmentHistoryDao } from '../dao/user_role_assignment_history.dao';
import { UserRoleAssignmentHistoryResponseDto } from '../dto/user_role_assignment_history_response.dto';
import { LoggingService } from '../../logs/logs.service';
import { UsersService } from 'src/users/users.service';
import { UpsertUserRoleAssignmentDto } from '../dto/upsert_user_role_assignment.dto';
import { BasePagination } from 'src/base.pagination';
import { UserRoleAssignmentHistory } from '../entities/user_role_assignment_history.entity';
import { MstCompany } from 'src/mst_companies/entities/mst_company.entity';
import { MstCompanyHqBranchRelationService } from 'src/mst_companies/service/company_hq_branch_relation.service';
import { SuccessResponseDto } from 'src/common/dto/success-response.dto';
import { CompanyMemberResponseDto } from 'src/mst_companies/dto/company-member-response.dto';
import { UserRoleAssignment } from '../entities/user_role_assignment.entity';

@Injectable()
export class UserRoleAssignmentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dao: UserRoleAssignmentDao,
    private readonly historyDao: UserRoleAssignmentHistoryDao,
    private readonly logger: LoggingService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => MstCompanyHqBranchRelationService))
    private readonly mstCompanyHqBranchRelationService: MstCompanyHqBranchRelationService,
  ) { }


  /**
   * Bulk create role assignments
   */
  private async bulkCreate(assignments: UpsertUserRoleAssignmentDto[], manager?: EntityManager): Promise<UserRoleAssignmentHistoryResponseDto[]> {
    this.logger.log(`Bulk create started with detail assignments ${JSON.stringify(assignments)}`);

    // Validate for duplicate combinations in payload
    const combinations = assignments.map(a => ({
      userId: a.user_id,
      companyHqId: a.company_hq_id || null,
      companyId: a.company_id || null,
      deptId: a.dept_id || null,
    }));

    const payloadDuplicates = this.findDuplicateCombinations(combinations);
    if (payloadDuplicates.length > 0) {
      this.logger.error(`Duplicate combinations in payload: ${payloadDuplicates.length} found`);
      throw new BadRequestException(`Duplicate combinations found in payload: ${JSON.stringify(payloadDuplicates)}`);
    }

    // Check for existing combinations in history table
    // Only check history table because:
    // - If exists in main table, it will also exist in history table
    // - If exists in history table but not in main, it might be inactive/deleted (still needs to prevent duplicate)
    const existingHistoryRecords = await this.historyDao.findExistingCombinations(combinations, manager);
    if (existingHistoryRecords.length > 0) {
      this.logger.error(`Database conflicts in history table: ${existingHistoryRecords.length} existing combinations`);
      throw new BadRequestException(`The following combinations already exist in the database: ${existingHistoryRecords.map(r => `userId=${r.userId}, companyHqId=${r.companyHqId}, companyId=${r.companyId}, deptId=${r.deptId}`).join('; ')}`);
    }

    // If no manager provided, create one; otherwise use existing
    if (!manager) {
      return this.dataSource.transaction(async (mgr) => this.performBulkCreate(assignments, mgr));
    } else {
      return this.performBulkCreate(assignments, manager);
    }
  }

  /**
   * Perform bulk create with given manager
   */
  private async performBulkCreate(assignments: UpsertUserRoleAssignmentDto[], manager: EntityManager): Promise<UserRoleAssignmentHistoryResponseDto[]> {
    const results: UserRoleAssignmentHistoryResponseDto[] = [];

    for (const assignmentDto of assignments) {
      const historyData = UpsertUserRoleAssignmentDto.toHistoryEntity(assignmentDto);

      // If status is ACTIVE, create assignment in main table first
      if (assignmentDto.status === UserRoleAssignmentStatus.ACTIVE) {
        const assignmentData = UpsertUserRoleAssignmentDto.toAssignmentEntity(assignmentDto);
        const assignment = await this.dao.create(assignmentData, manager);
        historyData.roleAssignmentId = assignment.id;
      }

      // Upsert history record
      const historyRecord = await this.historyDao.upsertHistory(historyData, manager);
      results.push(UserRoleAssignmentHistoryResponseDto.fromEntity(historyRecord));
    }

    this.logger.log(`Bulk create completed: ${results.length} assignments processed`);
    return results;
  }

  /**
   * Bulk update role assignments
   */
  private async bulkUpdate(assignments: UpsertUserRoleAssignmentDto[], manager?: EntityManager): Promise<UserRoleAssignmentHistoryResponseDto[]> {
    this.logger.log(`Bulk update started with detail assignments ${JSON.stringify(assignments)}`);

    // If no manager provided, create one; otherwise use existing
    if (!manager) {
      return this.dataSource.transaction(async (mgr) => this.performBulkUpdate(assignments, mgr));
    } else {
      return this.performBulkUpdate(assignments, manager);
    }
  }

  /**
   * Perform bulk update with given manager
   */
  private async performBulkUpdate(assignments: UpsertUserRoleAssignmentDto[], manager: EntityManager): Promise<UserRoleAssignmentHistoryResponseDto[]> {
    const historyIds = assignments.map(item => item.role_assignment_history_id);

    // Get existing history records
    const existingHistories = await this.historyDao.findByIds(historyIds, manager);

    if (existingHistories.length !== historyIds.length) {
      const foundIds = existingHistories.map(h => h.id);
      const missingIds = historyIds.filter(id => !foundIds.includes(id));
      this.logger.error(`History records not found: ${missingIds.join(', ')}`);
      throw new NotFoundException(`History records not found: ${missingIds.join(', ')}`);
    }

    const results: UserRoleAssignmentHistoryResponseDto[] = [];

    // Process updates
    for (const updateDto of assignments) {
      const existingHistory = existingHistories.find(h => h.id === updateDto.role_assignment_history_id);
      const oldStatus = existingHistory.status;
      const newStatus = updateDto.status ?? oldStatus;

      const updatedHistoryData = UpsertUserRoleAssignmentDto.toUpdatedHistoryEntity(updateDto, existingHistory);

      // Handle status transitions
      if (oldStatus === UserRoleAssignmentStatus.ACTIVE && newStatus === UserRoleAssignmentStatus.INACTIVE) {
        // ACTIVE → INACTIVE: Update history first, then delete main table entry
        updatedHistoryData.roleAssignmentId = null;

        // Update history record first to avoid FK constraint
        const updatedHistory = await this.historyDao.updateHistory(updateDto.role_assignment_history_id, updatedHistoryData, manager);

        // Then delete the main table entry
        if (existingHistory.roleAssignmentId) {
          await this.dao.hardDelete(existingHistory.roleAssignmentId, manager);
        }

        // Skip the general history update below since we already updated it
        results.push(UserRoleAssignmentHistoryResponseDto.fromEntity(updatedHistory));
        continue;
      } else if (oldStatus === UserRoleAssignmentStatus.INACTIVE && newStatus === UserRoleAssignmentStatus.ACTIVE) {
        // INACTIVE → ACTIVE: Create main table entry
        const assignmentData = UpsertUserRoleAssignmentDto.toAssignmentEntityFromHistory(updatedHistoryData);
        const assignment = await this.dao.create(assignmentData, manager);
        updatedHistoryData.roleAssignmentId = assignment.id;
      } else if (oldStatus === UserRoleAssignmentStatus.ACTIVE && newStatus === UserRoleAssignmentStatus.ACTIVE) {
        // ACTIVE → ACTIVE: Update main table entry
        if (existingHistory.roleAssignmentId) {
          const assignmentUpdateData = UpsertUserRoleAssignmentDto.toAssignmentEntityFromHistory(updatedHistoryData);
          await this.dao.update(existingHistory.roleAssignmentId, assignmentUpdateData, manager);
        }
      }

      // Update history record (skip for ACTIVE → INACTIVE case as it's already handled above)
      const updatedHistory = await this.historyDao.updateHistory(updateDto.role_assignment_history_id, updatedHistoryData, manager);
      results.push(UserRoleAssignmentHistoryResponseDto.fromEntity(updatedHistory));
    }

    this.logger.log(`Bulk update completed: ${results.length} assignments updated`);
    return results;
  }

  /**
   * Get active assignments by user ID
   */
  async getActiveByUserId(userId: string): Promise<UserRoleAssignmentHistoryResponseDto[]> {
    this.logger.log(`Getting active assignments for user: ${userId}`);

    const activeAssignments = await this.dao.findByUserId(userId);
    const histories = await this.historyDao.findHistoryByUserId(userId);

    // Filter histories that have corresponding active assignments
    const activeHistories = histories.filter(h =>
      h.roleAssignmentId && activeAssignments.some(a => a.id === h.roleAssignmentId)
    );

    const result = activeHistories.map(h => UserRoleAssignmentHistoryResponseDto.fromEntity(h));
    this.logger.log(`Found ${result.length} active assignments for user ${userId}`);

    return result;
  }

  async getActiveUserRoleByUserId(userId: string): Promise<string[]> {
    this.logger.log(`Getting active user roles for user: ${userId}`);

    const histories = await this.getActiveByUserId(userId);
    const result = histories.map(h => h.role);
    this.logger.log(`Found ${result.length} active user roles for user ${userId}`);

    return result;
  }

  /**
   * Get history by user ID (latest per combination)
   */
  async getHistoryByUserId(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<BasePagination<UserRoleAssignmentHistoryResponseDto>> {
    this.logger.log(`Getting history records for user: ${userId}, page: ${page}, limit: ${limit}`);

    // Get total count
    const total = await this.historyDao.countHistoryByUserId(userId);

    // Get paginated histories
    const histories = await this.historyDao.findHistoryByUserId(userId, page, limit);
    const items = histories.map(h => UserRoleAssignmentHistoryResponseDto.fromEntity(h));

    // Calculate pagination metadata
    const totalPages = page && limit ? Math.ceil(total / limit) : 1;

    this.logger.log(`Found ${items.length} history records for user ${userId} (total: ${total})`);

    return {
      items,
      meta: {
        total,
        page: page || 1,
        limit: limit || total,
        totalPages,
      },
    };
  }

  /**
   * Get detailed history by user ID with joined relations and selected fields
   */
  async getCompanyMemberResponseList(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<CompanyMemberResponseDto[]> {
    this.logger.log(`Getting detailed history records for user: ${userId}, page: ${page}, limit: ${limit}`);

    // Get paginated histories with joined relations and selected fields
    const items = await this.historyDao.findDetailedHistoryByUserId(userId, page, limit);

    this.logger.log(`Found ${items.length} detailed history records for user ${userId}`);

    return items.map(joinedData => CompanyMemberResponseDto.fromJoinedData(joinedData));
  }

  /**
   * Find duplicate combinations in array
   */
  private findDuplicateCombinations(combinations: Array<{
    userId: string;
    companyHqId: string | null;
    companyId: string | null;
    deptId: string | null;
  }>): Array<any> {
    const seen = new Set();
    const duplicates = [];

    for (const combo of combinations) {
      const key = `${combo.userId}-${combo.companyHqId}-${combo.companyId}-${combo.deptId}`;
      if (seen.has(key)) {
        duplicates.push(combo);
      } else {
        seen.add(key);
      }
    }

    return duplicates;
  }

  private async getExistingRecords(userId: string, companyHq?: MstCompany): Promise<UserRoleAssignmentHistory[]> {
    let existingRecords: UserRoleAssignmentHistory[] = [];
    if (companyHq) {
      // Use HQ scope only - get all records for user within this HQ (both HQ and branches)
      existingRecords = await this.historyDao.findByUserIdAndCompany(
        userId,
        companyHq.id,
        null
      );
      this.logger.log(`Found ${existingRecords.length} existing records for user ${userId} within HQ scope ${companyHq.id}`);
    } else {
      existingRecords = await this.historyDao.findByUserId(userId);
      this.logger.log(`Found ${existingRecords.length} existing records for user ${userId}`);
    }

    return existingRecords;
  }

  /**
   * Delete missing assignments
   */
  async deleteMissingAssignments(assignments: UpsertUserRoleAssignmentDto[],
    userId: string,
    manager: EntityManager,
    companyHq?: MstCompany): Promise<void> {
    const existingRecords: UserRoleAssignmentHistory[] = await this.getExistingRecords(userId, companyHq);

    // Identify records to delete (in DB but not in payload)
    const existingIds = existingRecords.map(record => record.id);
    const payloadIds = assignments
      .filter(item => item.role_assignment_history_id && item.role_assignment_history_id.trim() !== '')
      .map(item => item.role_assignment_history_id);
    const idsToDelete = existingIds.filter(id => !payloadIds.includes(id));

    // Process deletions
    if (idsToDelete.length > 0) {
      await this.processDeletedRecords(idsToDelete, manager);
      const scopeInfo = companyHq ? `within HQ scope ${companyHq.id}` : 'for all companies';
      this.logger.log(`[deleteMissingAssignments] Deleted ${idsToDelete.length} missing assignments for user ${userId} ${scopeInfo}`);
    }
  }

  /**
   * Delete all previous assignments onboarding state
   */
  private async deleteAllPrevAssignmentOnboardingState(userId: string, manager: EntityManager) {
    const existingRecords: UserRoleAssignmentHistory[] = await this.getExistingRecords(userId);

    // If any existing employer records that has no company role, delete that entry
    // this for mitigate use case when user create role first 'employer' then create the company (onboarding flow)
    const existingEmployerRecords = existingRecords.filter(record => record.role === UserRoleAssignmentRole.EMPLOYER && !record.companyRole);
    if (existingEmployerRecords.length > 0) {
      this.logger.log(`[deleteAllPrevAssignmentOnboardingState] Found ${existingEmployerRecords.length} existing employer records for user ${userId} with data: ${JSON.stringify(existingEmployerRecords)}`);
      await this.processDeletedRecords(existingEmployerRecords.map(record => record.id), manager);
      this.logger.log(`[deleteAllPrevAssignmentOnboardingState] Deleted ${existingEmployerRecords.length} existing employer records for user ${userId}`);
    }
  }

  /**
   * Universal upsert - reuse existing bulkCreate/bulkUpdate logic
   * All assignment populated on this request will be the SoT, any missing data from payload and existed on DB, will be deleted
   */
  async upsert(assignments: UpsertUserRoleAssignmentDto[], userId: string, companyId?: string): Promise<UserRoleAssignmentHistoryResponseDto[]> {
    this.logger.log(`Upsert started: ${assignments.length} assignments for user ${userId} and company ${companyId}`);

    let companyHq: MstCompany;
    if (companyId) {
      companyHq = await this.mstCompanyHqBranchRelationService.getHqCompanyFromBranch(companyId);
      if (!companyHq) {
        throw new BadRequestException('Company HQ not found');
      }

      // set company hq id to assignments
      assignments.forEach(a => {
        a.company_hq_id = companyHq.id;
      });
    }

    // do upsert assignments
    return this.dataSource.transaction(async manager => {
      const results: UserRoleAssignmentHistoryResponseDto[] = [];

      try {
        await this.deleteAllPrevAssignmentOnboardingState(userId, manager);
        await this.deleteMissingAssignments(assignments, userId, manager, companyHq);

        // Separate creates and updates based on historyId
        const creates = assignments.filter(item => !item.role_assignment_history_id || item.role_assignment_history_id.trim() === '');
        const updates = assignments.filter(item => item.role_assignment_history_id && item.role_assignment_history_id.trim() !== '');

        // Handle creates using existing bulkCreate
        if (creates.length > 0) {
          this.logger.log(`Creating ${creates.length} assignments`);
          const createResults = await this.bulkCreate(creates, manager);
          results.push(...createResults);
        }

        // Handle updates using bulkUpdate (without auto-deletion)
        if (updates.length > 0) {
          this.logger.log(`Updating ${updates.length} assignments`);
          const updateResults = await this.bulkUpdate(updates, manager);
          results.push(...updateResults);
        }

        this.logger.log(`Upsert completed: ${results.length} assignments processed`);
        return results;
      } catch (error) {
        this.logger.error(`Error in upsert operation: ${error.message}`, error.stack);
        throw error;
      }
    });
  }

  /**
   * Process records that need to be deleted
   */
  private async processDeletedRecords(idsToDelete: string[], manager: EntityManager): Promise<void> {
    this.logger.log(`Deleting ${idsToDelete.length} obsolete history records`);

    try {
      // First, get the records to delete to check for active assignments BEFORE deleting
      const recordsToDelete = await this.historyDao.findByIds(idsToDelete, manager);

      // Delete history records first
      this.logger.log(`Deleting ${idsToDelete.length} obsolete history records`);
      await this.historyDao.deleteByIds(idsToDelete, manager);

      // Delete active assignments
      for (const record of recordsToDelete) {
        if (record.roleAssignmentId) {
          this.logger.log(`Deleting active assignment: ${record.roleAssignmentId}`);
          await this.dao.hardDelete(record.roleAssignmentId, manager);
        }
      }
    } catch (error) {
      this.logger.error(`Error deleting records: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get owner assignment by company HQ ID
   */
  async getOwnerAssignment(companyHqId: string): Promise<UserRoleAssignment> {
    const assignments = await this.dao.findActiveByCompanyHqId(companyHqId);
    const ownerAssignment = assignments.find(assignment => assignment.companyRole === UserRoleAssignmentCompanyRole.OWNER_HQ);
    return ownerAssignment;
  }


  /**
   * Delete all role assignment and history records for a user (e.g. when soft-deleting the user).
   * Uses optional manager to run inside an existing transaction.
   */
  async deleteAllAssignmentsAndHistoryForUser(userId: string, manager?: EntityManager): Promise<void> {
    const run = async (em: EntityManager) => {
      const allHistory = await this.historyDao.findByUserId(userId, em);
      if (allHistory.length === 0) {
        this.logger.log(`No assignment history found for user ${userId}, skipping cleanup`);
        return;
      }
      const historyIds = allHistory.map((h) => h.id);
      this.logger.log(`Deleting ${historyIds.length} assignment/history records for user ${userId}`);
      await this.processDeletedRecords(historyIds, em);
    };

    if (manager) {
      await run(manager);
    } else {
      await this.dataSource.transaction(run);
    }
  }

  /**
   * Delete user assignments by company (hard delete)
   */
  async deactivateUserAssignmentsByCompany(
    userId: string,
    companyId?: string,
    companyHqId?: string
  ): Promise<SuccessResponseDto> {
    this.logger.log(`Deleting assignments for user: ${userId}, company: ${companyId}, HQ: ${companyHqId}`);

    // Handle company ID mapping logic: if companyId is empty but companyHqId is populated, companyId == companyHqId
    let finalCompanyId = companyId;
    const finalCompanyHqId = companyHqId;

    if (!companyId && companyHqId) {
      finalCompanyId = companyHqId;
      this.logger.log(`Mapping companyId to companyHqId: ${finalCompanyId}`);
    }

    // Find ALL assignments (active + inactive) for the user+company combination using existing DAO method
    const allAssignments = await this.historyDao.findByUserIdAndCompany(
      userId,
      finalCompanyHqId || null,
      finalCompanyId || null
    );

    if (allAssignments.length === 0) {
      this.logger.log(`No assignments found to delete`);
      return SuccessResponseDto.create('No assignments found to delete');
    }

    const ownerAssignment = allAssignments.find(assignment => assignment.companyRole === UserRoleAssignmentCompanyRole.OWNER_HQ);
    if (ownerAssignment) {
      this.logger.error(`Cannot delete owner assignment for user: ${userId}, company: ${companyId}, HQ: ${companyHqId}`);
      throw new BadRequestException('Cannot delete owner assignment');
    }

    // Get the history IDs to delete
    const historyIdsToDelete = allAssignments.map(assignment => assignment.id);

    // Use transaction to ensure atomic deletion
    return this.dataSource.transaction(async manager => {
      // Use existing processDeletedRecords method to handle deletion of both history and assignment records
      await this.processDeletedRecords(historyIdsToDelete, manager);

      this.logger.log(`Deleted ${historyIdsToDelete.length} assignments`);

      // Check if user has any remaining active assignments after deletion
      // If none remain, soft delete the user
      const remainingActive = await this.dao.findByUserId(userId, manager);
      if (remainingActive.length === 0) {
        this.logger.log(`No active assignments remain for user ${userId}, proceeding to soft delete user`);
        await this.usersService.softDelete(userId);
      }

      // Return success response
      return SuccessResponseDto.create(`Successfully deleted ${historyIdsToDelete.length} assignments`);
    });
  }

  /**
   * Check if department is used in any active assignments
   */
  async isDepartmentUsedInAssignments(deptId: string): Promise<boolean> {
    this.logger.log(`Checking if department ${deptId} is used in active assignments`);

    const isUsed = await this.historyDao.isDepartmentUsedInAssignments(deptId);
    this.logger.log(`Department ${deptId} used in active assignments: ${isUsed}`);

    return isUsed;
  }

  /**
   * Check if company and department are assigned
   */
  async isCompanyDeptAssigned(companyId: string, deptId: string): Promise<boolean> {
    this.logger.log(`Checking if company ${companyId} and department ${deptId} are assigned`);

    const isAssigned = await this.historyDao.isCompanyDeptAssigned(companyId, deptId);
    this.logger.log(`Company ${companyId} and department ${deptId} assigned: ${isAssigned}`);

    return isAssigned;
  }

  /**
   * Check if company has any assignments with null dept_id
   */
  async isCompanyAssigned(companyId: string): Promise<boolean> {
    this.logger.log(`Checking if company ${companyId} has assignments without department`);

    const isAssigned = await this.historyDao.isCompanyAssigned(companyId);
    this.logger.log(`Company ${companyId} has assignments without department: ${isAssigned}`);

    return isAssigned;
  }

  /**
   * Get one active assignment by user ID and ensure there's exactly one
   */
  private async getOneActiveByUserId(userId: string): Promise<UserRoleAssignmentHistoryResponseDto> {
    this.logger.log(`Getting one active assignment for user: ${userId}`);

    const activeAssignments = await this.getActiveByUserId(userId);

    if (activeAssignments.length === 0) {
      this.logger.error(`No active assignments found for user: ${userId}`);
      throw new NotFoundException(`No active assignments found for user: ${userId}`);
    }

    if (activeAssignments.length > 1) {
      this.logger.error(`Multiple active assignments found for user: ${userId} (${activeAssignments.length})`);
      throw new BadRequestException(`Multiple active assignments found for user: ${userId}. Only one active assignment is allowed.`);
    }

    this.logger.log(`Found exactly one active assignment for user: ${userId}`);
    return activeAssignments[0];
  }

  /**
   * Change the user's role. This function is only called if and only if the user has
   * already run through several wizard states but then backtracked and ended up in the
   * change role menu. So, we need to prepare the mechanism for this. But if the wizard
   * has already been completed, there is no capability to change the role.
   */
  public async changeUserRole(userId: string, nextRole: UserRoleAssignmentRole, assignments: UpsertUserRoleAssignmentDto[]): Promise<void> {
    this.logger.log(`Changing role for user: ${userId} to ${nextRole}`);

    // Get current active assignment
    const currentAssignment = await this.getOneActiveByUserId(userId);

    // Check if role is different
    if (currentAssignment.role === nextRole) {
      this.logger.log(`Role is already ${nextRole} for user: ${userId}`);
      return;
    }

    const results = await this.upsert(assignments, userId);
    if (results.length === 0) {
      this.logger.error(`Failed to change role for user: ${userId}`);
      return;
    }

    this.logger.log(`Successfully changed role for user: ${userId} from ${currentAssignment.role} to ${nextRole}`);
  }
  /**
   * Get company members with status filtering using history table
   */
  async getCompanyMembers(
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
    this.logger.log(`Getting company members with status filter: companyId=${companyId}, HQ=${companyHqId}, status=${status}, name=${name}, email=${email}, page=${page}, limit=${limit}, userId=${userId}`, "company-members-debug");

    const items = await this.historyDao.findDetailedHistoryByCompany(companyId, companyHqId, companyRole, deptId, name, email, status, page, limit, userId);

    this.logger.log(`Found ${items.length} company members with status filter - userId param: ${userId}`, "company-members-debug");
    
    // Log user IDs found for debugging
    if (items.length > 0) {
      const userIds = items.map(item => item.user_id);
      this.logger.log(`User IDs found: ${JSON.stringify(userIds)}`, "company-members-debug");
    }

    return items;
  }

  /**
   * Count company members with status filtering using history table
   */
  async countCompanyMembers(
    companyId?: string,
    companyHqId?: string,
    companyRole?: string,
    deptId?: string,
    name?: string,
    email?: string,
    status?: string,
    userId?: string,
  ): Promise<number> {
    this.logger.log(`Counting company members with status filter: companyId=${companyId}, HQ=${companyHqId}, status=${status}, name=${name}, email=${email}`);

    const count = await this.historyDao.countDetailedHistoryByCompany(companyId, companyHqId, companyRole, deptId, name, email, status, userId);

    this.logger.log(`Counted ${count} company members with status filter`);
    return count;
  }

  /**
   * Count distinct company members by user ID (unique users across all their role assignments)
   */
  async countDistinctCompanyMembersByUserId(
    companyId?: string,
    companyHqId?: string,
    companyRole?: string,
    deptId?: string,
    name?: string,
    email?: string,
    status?: string,
    userId?: string,
  ): Promise<number> {
    this.logger.log(`Counting distinct company members by user ID: companyId=${companyId}, HQ=${companyHqId}, status=${status}, name=${name}, email=${email}`);

    const count = await this.historyDao.countDistinctUsersByCompany(companyId, companyHqId, companyRole, deptId, name, email, status, userId);

    this.logger.log(`Counted ${count} distinct company members by user ID`);
    return count;
  }

  /**
   * Assert whether a user account can be deleted from the system.
   * Rules: If user has OWNER_HQ role, deletion is NOT allowed.
   */
  public async assertCanDeleteUserAccount(userId: string): Promise<void> {
    this.logger.log(`Validating delete-account rules for user: ${userId}`, "user-delete-validation");

    const activeAssignments = await this.getActiveByUserId(userId);

    // Check if user has OWNER_HQ role
    const hasOwnerRole = activeAssignments.some(
      assignment =>
        assignment.role === UserRoleAssignmentRole.EMPLOYER &&
        assignment.company_role === UserRoleAssignmentCompanyRole.OWNER_HQ
    );

    if (hasOwnerRole) {
      this.logger.error(
        `Delete-account validation failed: user ${userId} has OWNER_HQ role and cannot be deleted`,
        "user-delete-validation",
      );

      throw new BadRequestException(
        `Cannot delete account: user has OWNER_HQ role. Please transfer ownership first.`,
      );
    }
  }

  public async isUserInAnyCompanyRole(userId: string, companyRoles: UserRoleAssignmentCompanyRole[]): Promise<boolean> {
    const activeAssignments = await this.getActiveByUserId(userId);

    // filter employer only
    const employerAssignments = activeAssignments.filter(assignment => assignment.role === UserRoleAssignmentRole.EMPLOYER);
    if (employerAssignments.length === 0) {
      return false;
    }

    const userCompanyRoles = employerAssignments.map(assignment => assignment.company_role);
    return userCompanyRoles.some(companyRole => companyRoles.includes(companyRole));
  }

  public async isUserSysAdmin(userId: string): Promise<boolean> {
    const activeAssignments = await this.getActiveByUserId(userId);
    return activeAssignments.some(assignment => assignment.role === UserRoleAssignmentRole.SYS_ADMIN);
  }

  /**
   * Check if user has PIC_SCHOOL role for any school
   */
  public async isUserPicSchool(userId: string): Promise<boolean> {
    const assignments = await this.dao.findActiveByUserIdAndRole(
      userId,
      UserRoleAssignmentRole.PIC_SCHOOL
    );
    return assignments.length > 0;
  }

  /**
   * Get schools assigned to user with PIC_SCHOOL role
   */
  public async getUserAssignedSchools(userId: string): Promise<string[]> {
    const assignments = await this.dao.findActiveByUserIdAndRole(
      userId,
      UserRoleAssignmentRole.PIC_SCHOOL
    );
    
    return assignments
      .map(a => a.schoolId)
      .filter((id): id is string => id !== null);
  }

  /**
   * Check if user is PIC_SCHOOL for a specific school
   */
  public async isUserPicSchoolForSchool(
    userId: string,
    schoolId: string
  ): Promise<boolean> {
    const assignments = await this.dao.findActiveByUserIdAndRole(
      userId,
      UserRoleAssignmentRole.PIC_SCHOOL
    );
    
    return assignments.some(a => a.schoolId === schoolId);
  }
}
