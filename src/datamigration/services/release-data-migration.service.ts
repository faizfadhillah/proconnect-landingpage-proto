import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggingService } from 'src/logs/logs.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRoleAssignmentStatus, UserRoleAssignmentRole, UserRoleAssignmentCompanyRole } from 'src/user_role_assignments/enums/user_role_assignment.enums';
import { MstDepartment } from 'src/mst_departments/entities/mst_department.entity';
import { MstProfession } from 'src/mst_professions/entities/mst_profession.entity';
import { CompanyDepartmentMap } from 'src/company_department_map/entities/company_department_map.entity';
import { CompanyDepartmentMapDao } from 'src/company_department_map/dao/company_department_map.dao';
import { MstCompaniesService } from 'src/mst_companies/service/mst_companies.service';
import { MstCompaniesDao } from 'src/mst_companies/dao/mst_companies.dao';
import { MstCompany } from 'src/mst_companies/entities/mst_company.entity';
import { MstDepartmentsService } from 'src/mst_departments/mst_departments.service';
import { UsersService } from 'src/users/users.service';
import { MstCompanyHqBranchRelationService } from 'src/mst_companies/service/company_hq_branch_relation.service';
import { MigrationSummaryDto } from 'src/user_role_assignments/dto/migration_summary.dto';
import { UpsertUserRoleAssignmentDto } from 'src/user_role_assignments/dto/upsert_user_role_assignment.dto';
import { RoleAssignmentHelperService } from './role-assignment-helper.service';
import {
  COMPANY_NAME_UPDATES,
  COMPANY_SOFT_DELETES,
  COMPANY_STATUS_UPDATES,
  COMPANY_BRANCH_EMPTY,
  COMPANY_PARENT_BRANCH_NAME_UPDATES,
  DEPARTMENT_INSERTS,
  COMPANY_DEPARTMENT_MAPPINGS,
  USER_SOFT_DELETES,
  USER_ROLE_ASSIGNMENTS,
} from '../constants/migration-data.constants';

@Injectable()
export class ReleaseDataMigrationService {

  constructor(
    @InjectRepository(MstDepartment)
    private readonly mstDepartmentRepository: Repository<MstDepartment>,
    @InjectRepository(MstProfession)
    private readonly mstProfessionRepository: Repository<MstProfession>,
    @InjectRepository(CompanyDepartmentMap)
    private readonly companyDepartmentMapRepository: Repository<CompanyDepartmentMap>,
    private readonly companyDepartmentMapDao: CompanyDepartmentMapDao,
    private readonly mstCompaniesService: MstCompaniesService,
    private readonly mstCompaniesDao: MstCompaniesDao,
    private readonly mstDepartmentsService: MstDepartmentsService,
    private readonly usersService: UsersService,
    private readonly mstCompanyHqBranchRelationService: MstCompanyHqBranchRelationService,
    private readonly roleAssignmentHelperService: RoleAssignmentHelperService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Migrate release data (companies, departments, mappings, users, role assignments)
   * Processes all 9 tasks in sequence with independent error handling
   */
  async migrateReleaseData(): Promise<MigrationSummaryDto> {
    const summary: MigrationSummaryDto = {
      totalUsers: 0,
      usersSkipped: 0,
      usersMigrated: 0,
      usersFailed: 0,
      totalAssignmentsCreated: 0,
      failedUserIds: [],
      errorMessages: [],
    };

    this.loggingService.log('Starting release data migration...');

    // Track created departments for mapping
    const createdDepartmentMap = new Map<string, string>(); // name -> id

    // Task 1: Company name updates
    await this.processTask1_CompanyNameUpdates(summary);

    // Task 2: Company soft delete
    await this.processTask2_CompanySoftDelete(summary);

    // Task 3: Company status updates (set INACTIVE)
    await this.processTask3_CompanyStatusUpdates(summary);

    // Task 4: Company branch empty updates
    await this.processTask4_CompanyBranchEmpty(summary);

    // Task 5: Company parent/branch/name updates
    await this.processTask5_CompanyParentBranchNameUpdates(summary);

    // Task 6: Create departments
    await this.processTask6_CreateDepartments(summary, createdDepartmentMap);

    // Task 7: Company-department mappings
    await this.processTask7_CompanyDepartmentMappings(summary, createdDepartmentMap);

    // Task 8: Soft delete users
    await this.processTask8_SoftDeleteUsers(summary);

    // Task 9: Create user role assignments
    await this.processTask9_CreateUserRoleAssignments(summary, createdDepartmentMap);

    this.loggingService.log(`Migration completed. Summary: ${JSON.stringify(summary)}`);
    return summary;
  }

  /**
   * Task 1: Update company names
   */
  private async processTask1_CompanyNameUpdates(summary: MigrationSummaryDto): Promise<void> {
    this.loggingService.log('Task 1: Updating company names...');
    try {
      for (const update of COMPANY_NAME_UPDATES) {
        try {
          await this.mstCompaniesDao.updateForMigration(update.companyId, { company_name: update.companyName } as Partial<MstCompany>);
          this.loggingService.log(`Updated company ${update.companyId} name to ${update.companyName}`);
        } catch (error) {
          const errorMsg = `[Company Update] Failed to update company ${update.companyId}: ${error.message}`;
          summary.errorMessages.push(errorMsg);
          this.loggingService.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `[Company Update] Task 1 failed: ${error.message}`;
      summary.errorMessages.push(errorMsg);
      this.loggingService.error(errorMsg);
    }
  }

  /**
   * Task 2: Soft delete companies
   */
  private async processTask2_CompanySoftDelete(summary: MigrationSummaryDto): Promise<void> {
    this.loggingService.log('Task 2: Soft deleting companies...');
    try {
      for (const companyDelete of COMPANY_SOFT_DELETES) {
        try {
          // Skip HQ validation for migration - allow soft delete of HQ companies
          await this.mstCompaniesService.remove(companyDelete.companyId, true);
          this.loggingService.log(`Soft deleted company ${companyDelete.companyId}`);
        } catch (error) {
          const errorMsg = `[Company Soft Delete] Failed to soft delete company ${companyDelete.companyId}: ${error.message}`;
          summary.errorMessages.push(errorMsg);
          this.loggingService.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `[Company Soft Delete] Task 2 failed: ${error.message}`;
      summary.errorMessages.push(errorMsg);
      this.loggingService.error(errorMsg);
    }
  }

  /**
   * Task 3: Update company status to INACTIVE
   */
  private async processTask3_CompanyStatusUpdates(summary: MigrationSummaryDto): Promise<void> {
    this.loggingService.log('Task 3: Updating company status...');
    try {
      for (const update of COMPANY_STATUS_UPDATES) {
        try {
          await this.mstCompaniesDao.updateForMigration(update.companyId, { status: update.status } as Partial<MstCompany>);
          this.loggingService.log(`Updated company ${update.companyId} status to ${update.status}`);
        } catch (error) {
          const errorMsg = `[Company Status] Failed to update company ${update.companyId}: ${error.message}`;
          summary.errorMessages.push(errorMsg);
          this.loggingService.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `[Company Status] Task 3 failed: ${error.message}`;
      summary.errorMessages.push(errorMsg);
      this.loggingService.error(errorMsg);
    }
  }

  /**
   * Task 4: Set company branch to empty
   */
  private async processTask4_CompanyBranchEmpty(summary: MigrationSummaryDto): Promise<void> {
    this.loggingService.log('Task 4: Setting company branch to empty...');
    try {
      for (const update of COMPANY_BRANCH_EMPTY) {
        try {
          await this.mstCompaniesDao.updateForMigration(update.companyId, { branch: '' } as Partial<MstCompany>);
          this.loggingService.log(`Updated company ${update.companyId} branch to empty`);
        } catch (error) {
          const errorMsg = `[Company Branch] Failed to update company ${update.companyId}: ${error.message}`;
          summary.errorMessages.push(errorMsg);
          this.loggingService.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `[Company Branch] Task 4 failed: ${error.message}`;
      summary.errorMessages.push(errorMsg);
      this.loggingService.error(errorMsg);
    }
  }

  /**
   * Task 5: Update company parent/branch/name
   */
  private async processTask5_CompanyParentBranchNameUpdates(summary: MigrationSummaryDto): Promise<void> {
    this.loggingService.log('Task 5: Updating company parent/branch/name...');
    try {
      for (const update of COMPANY_PARENT_BRANCH_NAME_UPDATES) {
        try {
          await this.mstCompaniesDao.updateForMigration(update.companyId, {
            parent_id: update.parentId,
            branch: update.branch,
            company_name: update.companyName,
          } as Partial<MstCompany>);
          this.loggingService.log(`Updated company ${update.companyId} parent/branch/name`);
        } catch (error) {
          const errorMsg = `[Company Parent/Branch/Name] Failed to update company ${update.companyId}: ${error.message}`;
          summary.errorMessages.push(errorMsg);
          this.loggingService.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `[Company Parent/Branch/Name] Task 5 failed: ${error.message}`;
      summary.errorMessages.push(errorMsg);
      this.loggingService.error(errorMsg);
    }
  }

  /**
   * Task 6: Create departments
   */
  private async processTask6_CreateDepartments(
    summary: MigrationSummaryDto,
    createdDepartmentMap: Map<string, string>,
  ): Promise<void> {
    this.loggingService.log('Task 6: Creating departments...');
    try {
      for (const dept of DEPARTMENT_INSERTS) {
        try {
          // Check if department already exists
          const existing = await this.findDepartmentByName(dept.name);
          if (existing) {
            this.loggingService.log(`Department ${dept.name} already exists, skipping`);
            createdDepartmentMap.set(dept.name, existing.id);
            continue;
          }

          const created = await this.mstDepartmentsService.create({
            dept_name: dept.name,
            flag: dept.flag,
          });
          createdDepartmentMap.set(dept.name, created.id);
          this.loggingService.log(`Created department ${dept.name} with id ${created.id}`);
        } catch (error) {
          const errorMsg = `[Department Create] Failed to create department ${dept.name}: ${error.message}`;
          summary.errorMessages.push(errorMsg);
          this.loggingService.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `[Department Create] Task 6 failed: ${error.message}`;
      summary.errorMessages.push(errorMsg);
      this.loggingService.error(errorMsg);
    }
  }

  /**
   * Task 7: Create company-department mappings
   */
  private async processTask7_CompanyDepartmentMappings(
    summary: MigrationSummaryDto,
    createdDepartmentMap: Map<string, string>,
  ): Promise<void> {
    this.loggingService.log('Task 7: Creating company-department mappings...');
    try {
      const globalDeptIds = Array.from(createdDepartmentMap.values());

      for (const mapping of COMPANY_DEPARTMENT_MAPPINGS) {
        try {
          // Create mapping for each global department
          for (const deptId of globalDeptIds) {
            // Check if mapping already exists
            const existing = await this.companyDepartmentMapRepository.findOne({
              where: {
                company_hq_id: mapping.companyHqId,
                company_id: mapping.companyId,
                dept_id: deptId,
                deleted_at: null,
              },
            });

            if (existing) {
              this.loggingService.log(`Mapping already exists for company ${mapping.companyId}, dept ${deptId}, skipping`);
              continue;
            }

            await this.companyDepartmentMapDao.create({
              company_hq_id: mapping.companyHqId,
              company_id: mapping.companyId,
              dept_id: deptId,
            });
            this.loggingService.log(`Created mapping for company ${mapping.companyId}, dept ${deptId}`);
          }
        } catch (error) {
          const errorMsg = `[Company-Dept Mapping] Failed to create mapping for company ${mapping.companyId}: ${error.message}`;
          summary.errorMessages.push(errorMsg);
          this.loggingService.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `[Company-Dept Mapping] Task 7 failed: ${error.message}`;
      summary.errorMessages.push(errorMsg);
      this.loggingService.error(errorMsg);
    }
  }

  /**
   * Task 8: Soft delete users
   */
  private async processTask8_SoftDeleteUsers(summary: MigrationSummaryDto): Promise<void> {
    this.loggingService.log('Task 8: Soft deleting users...');
    try {
      for (const userDelete of USER_SOFT_DELETES) {
        try {
          const user = await this.usersService.findByEmail(userDelete.email);
          await this.usersService.softDelete(user.id);
          this.loggingService.log(`Soft deleted user ${userDelete.email}`);
        } catch (error) {
          if (error instanceof NotFoundException) {
            const errorMsg = `[User Delete] User with email ${userDelete.email} not found`;
            summary.errorMessages.push(errorMsg);
            this.loggingService.warn(errorMsg);
          } else {
            const errorMsg = `[User Delete] Failed to soft delete user ${userDelete.email}: ${error.message}`;
            summary.errorMessages.push(errorMsg);
            this.loggingService.error(errorMsg);
          }
        }
      }
    } catch (error) {
      const errorMsg = `[User Delete] Task 8 failed: ${error.message}`;
      summary.errorMessages.push(errorMsg);
      this.loggingService.error(errorMsg);
    }
  }

  /**
   * Task 9: Create user role assignments
   */
  private async processTask9_CreateUserRoleAssignments(
    summary: MigrationSummaryDto,
    createdDepartmentMap: Map<string, string>,
  ): Promise<void> {
    this.loggingService.log('Task 9: Creating user role assignments...');
    
    // Track users that need company_id update
    const usersToUpdateCompanyId = new Map<string, string>(); // userId -> newCompanyId

    try {
      for (const assignment of USER_ROLE_ASSIGNMENTS) {
        try {
          // Find user by email
          const user = await this.usersService.findByEmail(assignment.email);

          // Track if user's company_id needs to be updated
          if (user.company_id !== assignment.companyId) {
            usersToUpdateCompanyId.set(user.id, assignment.companyId);
            this.loggingService.log(`User ${assignment.email} will have company_id updated from ${user.company_id} to ${assignment.companyId}`);
          }

          // Find department by name - first check createdDepartmentMap, then query if not found
          let deptId: string | null = null;
          if (createdDepartmentMap.has(assignment.department)) {
            deptId = createdDepartmentMap.get(assignment.department)!;
          } else {
            // Fallback: query database if not in map (for existing departments)
            const department = await this.findDepartmentByName(assignment.department);
            if (department) {
              deptId = department.id;
            } else {
              const errorMsg = `[Role Assignment] Department ${assignment.department} not found for user ${assignment.email}`;
              summary.errorMessages.push(errorMsg);
              this.loggingService.error(errorMsg);
              continue; // Skip this assignment - expected to exist in DB
            }
          }

          // Find profession by job title (case-insensitive)
          let professionId: string | null = null;
          const profession = await this.findProfessionByName(assignment.jobTitle);
          if (profession) {
            professionId = profession.id;
          } else {
            const errorMsg = `[Role Assignment] Profession ${assignment.jobTitle} not found for user ${assignment.email}`;
            summary.errorMessages.push(errorMsg);
            this.loggingService.error(errorMsg);
            continue; // Skip this assignment - expected to exist in DB
          }

          // Determine company_hq_id
          let companyHqId: string = assignment.companyId;
          try {
            const companyHq = await this.mstCompanyHqBranchRelationService.getHqCompanyFromBranch(assignment.companyId);
            if (companyHq) {
              companyHqId = companyHq.id;
            }
          } catch (error) {
            const errorMsg = `[Role Assignment] Could not get HQ for company ${assignment.companyId} (user ${assignment.email}): ${error.message}`;
            summary.errorMessages.push(errorMsg);
            this.loggingService.error(errorMsg);
            continue; // Skip this assignment - expected company to exist and be valid
          }

          // Determine if company is HQ
          const isCompanyHq = companyHqId === assignment.companyId;

          // Map company role string to enum
          const companyRole = this.mapCompanyRoleStringToEnum(assignment.role, isCompanyHq);

          // Create assignment DTO
          const assignmentDto = new UpsertUserRoleAssignmentDto();
          assignmentDto.user_id = user.id;
          assignmentDto.role = UserRoleAssignmentRole.EMPLOYER;
          assignmentDto.company_id = assignment.companyId;
          assignmentDto.company_hq_id = companyHqId;
          assignmentDto.company_role = companyRole;
          assignmentDto.dept_id = deptId;
          assignmentDto.profession_id = professionId;
          assignmentDto.status = UserRoleAssignmentStatus.ACTIVE;
          assignmentDto.start_date = new Date().toISOString().split('T')[0];

          // Create role assignment
          await this.roleAssignmentHelperService.createRoleAssignments([assignmentDto]);
          summary.totalAssignmentsCreated++;
          this.loggingService.log(`Created role assignment for user ${assignment.email}`);
        } catch (error) {
          if (error instanceof NotFoundException && error.message.includes('email')) {
            const errorMsg = `[Role Assignment] User with email ${assignment.email} not found`;
            summary.errorMessages.push(errorMsg);
            this.loggingService.warn(errorMsg);
          } else {
            const errorMsg = `[Role Assignment] Failed to create assignment for email ${assignment.email}, company ${assignment.companyId}: ${error.message}`;
            summary.errorMessages.push(errorMsg);
            this.loggingService.error(errorMsg);
          }
        }
      }

      // Update users.company_id for users that need it
      for (const [userId, newCompanyId] of usersToUpdateCompanyId.entries()) {
        try {
          const user = await this.usersService.findOne(userId);
          await this.usersService.updateUserProfile(user, { company_id: newCompanyId });
          this.loggingService.log(`Updated user ${user.email} company_id to ${newCompanyId}`);
        } catch (error) {
          const errorMsg = `[User Company Update] Failed to update company_id for user ${userId}: ${error.message}`;
          summary.errorMessages.push(errorMsg);
          this.loggingService.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `[Role Assignment] Task 9 failed: ${error.message}`;
      summary.errorMessages.push(errorMsg);
      this.loggingService.error(errorMsg);
    }
  }

  /**
   * Helper: Find department by name (exact match or case-insensitive)
   */
  private async findDepartmentByName(name: string): Promise<MstDepartment | null> {
    const department = await this.mstDepartmentRepository.findOne({
      where: { dept_name: name },
    });
    if (department) {
      return department;
    }

    // Try case-insensitive search
    const departments = await this.mstDepartmentRepository
      .createQueryBuilder('dept')
      .where('LOWER(dept.dept_name) = LOWER(:name)', { name })
      .getMany();

    return departments.length > 0 ? departments[0] : null;
  }

  /**
   * Helper: Find profession by name (case-insensitive ILIKE)
   */
  private async findProfessionByName(name: string): Promise<MstProfession | null> {
    const professions = await this.mstProfessionRepository
      .createQueryBuilder('prof')
      .where('LOWER(prof.name) LIKE LOWER(:name)', { name: `%${name}%` })
      .getMany();

    return professions.length > 0 ? professions[0] : null;
  }

  /**
   * Helper: Map company role string to UserRoleAssignmentCompanyRole enum
   */
  private mapCompanyRoleStringToEnum(role: string, isCompanyHq: boolean): UserRoleAssignmentCompanyRole {
    switch (role) {
      case 'HRD HQ':
        return UserRoleAssignmentCompanyRole.HRD_HQ;
      case 'HRD Branch':
        return UserRoleAssignmentCompanyRole.HRD_BRANCH;
      case 'PIC Branch':
        return UserRoleAssignmentCompanyRole.PIC_BRANCH;
      case 'Owner HQ':
        return UserRoleAssignmentCompanyRole.OWNER_HQ;
      case 'Member':
        return UserRoleAssignmentCompanyRole.MEMBER;
      default:
        throw new Error(`Unknown company role: ${role}`);
    }
  }
}

