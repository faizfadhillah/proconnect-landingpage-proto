import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { UserRoleAssignmentStatus, UserRoleAssignmentRole, UserRoleAssignmentCompanyRole } from 'src/user_role_assignments/enums/user_role_assignment.enums';
import { CompanyRole, User } from 'src/users/entities/user.entity';
import { UserEducation } from 'src/user_educations/entities/user_education.entity';
import { MstMajor } from 'src/mst_majors/entities/mst_major.entity';
import { MigrationDao } from '../dao/migration.dao';
import { MigrationSummaryDto } from 'src/user_role_assignments/dto/migration_summary.dto';
import { UpsertUserRoleAssignmentDto } from 'src/user_role_assignments/dto/upsert_user_role_assignment.dto';
import { MstCompanyHqBranchRelationService } from 'src/mst_companies/service/company_hq_branch_relation.service';
import { RoleAssignmentHelperService } from './role-assignment-helper.service';
import { LoggingService } from 'src/logs/logs.service';
import { EncryptedUserDataService } from 'src/encrypted_user_data/encrypted_user_data.service';
import { extractLast4Digits } from 'src/utils/phone.util';

@Injectable()
export class MigrationService {
  constructor(
    private readonly migrationDao: MigrationDao,
    private readonly mstCompanyHqBranchRelationService: MstCompanyHqBranchRelationService,
    private readonly roleAssignmentHelperService: RoleAssignmentHelperService,
    private readonly loggingService: LoggingService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserEducation)
    private readonly userEducationRepository: Repository<UserEducation>,
    @InjectRepository(MstMajor)
    private readonly majorRepository: Repository<MstMajor>,
    private readonly encryptedUserDataService: EncryptedUserDataService,
  ) {}

  /**
   * Migrate candidate and sys_admin roles from users table to role assignments
   * Note: Employer roles are handled separately by release-data migration
   */
  async migrateCandidateAndSysAdmin(): Promise<MigrationSummaryDto> {
    const summary: MigrationSummaryDto = {
      totalUsers: 0,
      usersSkipped: 0,
      usersMigrated: 0,
      usersFailed: 0,
      totalAssignmentsCreated: 0,
      failedUserIds: [],
      errorMessages: [],
    };

    try {
      // Step 1: Get all users with their role data
      this.loggingService.log('Starting candidate and sys_admin role migration...');
      const users = await this.migrationDao.getAllUsersForMigration();

      summary.totalUsers = users.length;
      this.loggingService.log(`Found ${users.length} users to process`);

      // Step 2: Get existing user role assignments to skip already migrated users
      const existingUserIds = await this.migrationDao.getExistingUserAssignmentIds();

      // Step 3: Process each user
      for (const user of users) {
        try {
          // Skip if user already has role assignments
          if (existingUserIds.has(user.id)) {
            summary.usersSkipped++;
            continue;
          }

          const assignmentsToCreate = await this.buildUserRoleAssignments(user);
          
          if (assignmentsToCreate.length > 0) {
            // Create role assignments using DAO directly
            await this.roleAssignmentHelperService.createRoleAssignments(assignmentsToCreate);
            
            summary.usersMigrated++;
            summary.totalAssignmentsCreated += assignmentsToCreate.length;
            
            this.loggingService.debug(`Migrated user ${user.id} with ${assignmentsToCreate.length} role assignments`);
          }

        } catch (error) {
          summary.usersFailed++;
          summary.failedUserIds.push(user.id);
          summary.errorMessages.push(`User ${user.id}: ${error.message}`);
          this.loggingService.error(`Failed to migrate user ${user.id}: ${error.message}`, error.stack);
        }
      }

      this.loggingService.log(`Migration completed. Summary: ${JSON.stringify(summary)}`);
      return summary;

    } catch (error) {
      this.loggingService.error(`Migration failed: ${error.message}`, error.stack);
      throw error;
    }
  }


  /**
   * Build role assignments for a user based on their current role data
   */
  private async buildUserRoleAssignments(user: any): Promise<UpsertUserRoleAssignmentDto[]> {
    const assignments: UpsertUserRoleAssignmentDto[] = [];
    const startDate = user.created_at ? user.created_at.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    // Handle JSONB roles array (e.g., ["sys_admin"])
    // Only process candidate and sys_admin roles; employer roles are handled by release-data migration
    if (user.roles && Array.isArray(user.roles)) {
      for (const role of user.roles) {
        const roleLower = role.toLowerCase();
        
        // Skip employer role - handled by release-data migration
        if (roleLower === 'employer') {
          continue;
        }
        
        // Only process candidate and sys_admin roles
        if (roleLower !== 'candidate' && roleLower !== 'sys_admin') {
          this.loggingService.warn(`Unknown role "${role}" for user ${user.id}, skipping`);
          continue;
        }
        
        const assignment = await this.createRoleAssignmentDto(
          user, 
          this.mapRoleToAssignmentRole(role), 
          startDate
        );
        if (assignment) {
          assignments.push(assignment);
        }
      }
    }

    return assignments;
  }

  /**
   * Create a role assignment DTO for a user
   */
  private async createRoleAssignmentDto(
    user: any, 
    role: UserRoleAssignmentRole, 
    startDate: string
  ): Promise<UpsertUserRoleAssignmentDto | null> {
    try {
      const dto = new UpsertUserRoleAssignmentDto();
      dto.user_id = user.id;
      dto.role = role;
      dto.start_date = startDate;
      dto.status = UserRoleAssignmentStatus.ACTIVE;
      dto.employment_type = user.employment_status || null;

      // Handle employer role - need company info
      if (role === UserRoleAssignmentRole.EMPLOYER && user.company_id) {
        dto.company_id = user.company_id;

        let isCompanyHq = false;
        // Get company HQ
        try {
          const companyHq = await this.mstCompanyHqBranchRelationService.getHqCompanyFromBranch(user.company_id);
          dto.company_hq_id = companyHq ? companyHq.id : user.company_id; // Fallback to same company if no HQ found
            if (companyHq && companyHq.id === user.company_id) {
                isCompanyHq = true;
            }
        } catch (error) {
          this.loggingService.warn(`Could not get HQ for company ${user.company_id}: ${error.message}`);
          dto.company_hq_id = user.company_id; // Fallback
        }

        // Map company role
        if (user.company_role) {
          dto.company_role = this.mapCompanyRole(user.company_role, isCompanyHq);
        }

        // dept_id left empty as requested
        dto.dept_id = null;
      } else if (role === UserRoleAssignmentRole.EMPLOYER && !user.company_id) {
        // Skip employer role if no company ID
        this.loggingService.warn(`Skipping employer role for user ${user.id} due to missing company_id`);
        return null;
      }

      return dto;
    } catch (error) {
      this.loggingService.error(`Error creating assignment DTO for user ${user.id} with role ${role}: ${error.message}`);
      return null;
    }
  }

  /**
   * Map roles from JSONB array to assignment roles
   */
  private mapRoleToAssignmentRole(role: string): UserRoleAssignmentRole {
    switch (role.toLowerCase()) {
      case 'sys_admin':
        return UserRoleAssignmentRole.SYS_ADMIN;
      case 'admin':
        return UserRoleAssignmentRole.ADMIN;
      case 'candidate':
        return UserRoleAssignmentRole.CANDIDATE;
      case 'employer':
        return UserRoleAssignmentRole.EMPLOYER;
      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }

  /**
   * Map company role to assignment company role
   */
  private mapCompanyRole(companyRole: CompanyRole, isCompanyHq: boolean): UserRoleAssignmentCompanyRole {
    switch (companyRole) {
      case CompanyRole.OWNER:
        return UserRoleAssignmentCompanyRole.OWNER_HQ;
      case CompanyRole.HRD:
        return isCompanyHq ? UserRoleAssignmentCompanyRole.HRD_HQ : UserRoleAssignmentCompanyRole.HRD_BRANCH;
      case CompanyRole.MEMBER:
        return UserRoleAssignmentCompanyRole.MEMBER;
      default:
        throw new Error(`Unknown company_role: ${companyRole}`);
    }
  }

  /**
   * Migrate phone last 4 digits for existing users
   * Gets all users, decrypts their phone numbers, and extracts last 4 digits
   */
  async migratePhoneLast4Digits(): Promise<{ total: number; updated: number; skipped: number; errors: number }> {
    const summary = {
      total: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      this.loggingService.log('Starting phone last 4 digits migration...');
      
      // Get all active users
      const users = await this.userRepository.find({
        where: { deleted_at: null },
        select: ['id', 'phone_last_4_digits'],
      });

      summary.total = users.length;
      this.loggingService.log(`Found ${users.length} users to process`);

      // Process each user
      for (const user of users) {
        try {
          // Skip if already has phone_last_4_digits (idempotent)
          if (user.phone_last_4_digits) {
            summary.skipped++;
            continue;
          }

          // Get decrypted phone from encrypted_user_data
          const encryptedData = await this.encryptedUserDataService.findOneDecrypted(user.id);
          
          if (!encryptedData || !encryptedData.encrypted_phone) {
            summary.skipped++;
            continue;
          }

          // Extract last 4 digits
          const last4Digits = extractLast4Digits(encryptedData.encrypted_phone);
          
          if (last4Digits) {
            user.phone_last_4_digits = last4Digits;
            await this.userRepository.save(user);
            summary.updated++;
            this.loggingService.debug(`Updated phone_last_4_digits for user ${user.id}: ${last4Digits}`);
          } else {
            summary.skipped++;
          }

        } catch (error) {
          summary.errors++;
          this.loggingService.error(`Failed to migrate phone_last_4_digits for user ${user.id}: ${error.message}`, error.stack);
        }
      }

      this.loggingService.log(`Phone last 4 digits migration completed. Summary: ${JSON.stringify(summary)}`);
      return summary;

    } catch (error) {
      this.loggingService.error(`Phone last 4 digits migration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Migrate major_id for user educations that have major string but no major_id
   * Finds or creates majors based on major string field
   */
  async migrateUserEducationMajorIds(): Promise<{ total: number; updated: number; created: number; skipped: number; errors: number }> {
    const summary = {
      total: 0,
      updated: 0,
      created: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      this.loggingService.log('Starting user education major_id migration...');
      
      // Get all user educations where major_id is null
      const educations = await this.userEducationRepository.find({
        where: {
          major_id: IsNull(),
          deleted_at: IsNull(),
        },
        select: ['id', 'major', 'major_id'],
      });

      // Filter: only process educations with non-empty major string
      const educationsToProcess = educations.filter(edu => edu.major && edu.major.trim().length > 0);
      
      summary.total = educationsToProcess.length;
      this.loggingService.log(`Found ${educationsToProcess.length} educations to process`);

      // Process each education
      for (const education of educationsToProcess) {
        try {
          const trimmedMajor = education.major.trim();
          
          if (!trimmedMajor) {
            summary.skipped++;
            continue;
          }

          // Case-insensitive search for existing major
          const existingMajor = await this.majorRepository
            .createQueryBuilder('major')
            .where('LOWER(major.major_name) = LOWER(:name)', {
              name: trimmedMajor,
            })
            .andWhere('major.deleted_at IS NULL')
            .getOne();

          let majorId: string;

          if (existingMajor) {
            // Use existing major
            majorId = existingMajor.id;
            this.loggingService.debug(`Found existing major for "${trimmedMajor}": ${majorId}`);
          } else {
            // Create new major
            try {
              const newMajor = this.majorRepository.create({
                major_name: trimmedMajor,
              });
              const savedMajor = await this.majorRepository.save(newMajor);
              majorId = savedMajor.id;
              summary.created++;
              this.loggingService.debug(`Created new major "${trimmedMajor}": ${majorId}`);
            } catch (error) {
              // Push error and continue to next education
              summary.errors++;
              this.loggingService.error(
                `Failed to create major "${trimmedMajor}" for education ${education.id}: ${error.message}`,
                error.stack
              );
              continue; // Skip this education and continue to next
            }
          }

          // Update education with major_id
          education.major_id = majorId;
          await this.userEducationRepository.save(education);
          summary.updated++;
          this.loggingService.debug(`Updated education ${education.id} with major_id: ${majorId}`);

        } catch (error) {
          summary.errors++;
          this.loggingService.error(
            `Failed to migrate major_id for education ${education.id}: ${error.message}`,
            error.stack
          );
        }
      }

      this.loggingService.log(`User education major_id migration completed. Summary: ${JSON.stringify(summary)}`);
      return summary;

    } catch (error) {
      this.loggingService.error(`User education major_id migration failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
