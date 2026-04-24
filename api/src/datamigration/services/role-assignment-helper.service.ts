import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRoleAssignmentStatus } from 'src/user_role_assignments/enums/user_role_assignment.enums';
import { UserRoleAssignmentDao } from 'src/user_role_assignments/dao/user_role_assignment.dao';
import { UserRoleAssignmentHistoryDao } from 'src/user_role_assignments/dao/user_role_assignment_history.dao';
import { UpsertUserRoleAssignmentDto } from 'src/user_role_assignments/dto/upsert_user_role_assignment.dto';

@Injectable()
export class RoleAssignmentHelperService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userRoleAssignmentDao: UserRoleAssignmentDao,
    private readonly userRoleAssignmentHistoryDao: UserRoleAssignmentHistoryDao,
  ) {}

  /**
   * Create role assignments using DAO directly
   * Shared method for migration services
   */
  async createRoleAssignments(assignments: UpsertUserRoleAssignmentDto[]): Promise<void> {
    return this.dataSource.transaction(async manager => {
      for (const assignmentDto of assignments) {
        const historyData = UpsertUserRoleAssignmentDto.toHistoryEntity(assignmentDto);

        // If status is ACTIVE, create assignment in main table first
        if (assignmentDto.status === UserRoleAssignmentStatus.ACTIVE) {
          const assignmentData = UpsertUserRoleAssignmentDto.toAssignmentEntity(assignmentDto);
          const assignment = await this.userRoleAssignmentDao.create(assignmentData, manager);
          historyData.roleAssignmentId = assignment.id;
        }

        // Upsert history record
        await this.userRoleAssignmentHistoryDao.upsertHistory(historyData, manager);
      }
    });
  }
}

