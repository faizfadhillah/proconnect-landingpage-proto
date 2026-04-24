import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReleaseDataMigrationService } from './services/release-data-migration.service';
import { MigrationService } from './services/migration.service';
import { MigrationSummaryDto } from 'src/user_role_assignments/dto/migration_summary.dto';

@ApiTags('data-migration')
@ApiBearerAuth()
@Controller('data-migration')
export class DataMigrationController {
  constructor(
    private readonly releaseDataMigrationService: ReleaseDataMigrationService,
    private readonly migrationService: MigrationService,
  ) {}

  @Post('release-data')
  @ApiOperation({
    summary: 'Migrate release data (companies, departments, mappings, users, role assignments). Handles employer roles from constants and candidate/sys_admin roles from users table.',
    operationId: 'migrateReleaseData',
  })
  @ApiResponse({
    status: 201,
    description: 'Migration completed successfully',
    type: MigrationSummaryDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async migrateReleaseData(): Promise<MigrationSummaryDto> {
    // Step 1: Migrate employer roles from release data (companies, departments, mappings, user role assignments)
    const releaseDataSummary = await this.releaseDataMigrationService.migrateReleaseData();
    
    // Step 2: Migrate candidate and sys_admin roles from users table
    const candidateSysAdminSummary = await this.migrationService.migrateCandidateAndSysAdmin();
    
    // Step 3: Merge summaries
    const mergedSummary: MigrationSummaryDto = {
      totalUsers: releaseDataSummary.totalUsers + candidateSysAdminSummary.totalUsers,
      usersSkipped: releaseDataSummary.usersSkipped + candidateSysAdminSummary.usersSkipped,
      usersMigrated: releaseDataSummary.usersMigrated + candidateSysAdminSummary.usersMigrated,
      usersFailed: releaseDataSummary.usersFailed + candidateSysAdminSummary.usersFailed,
      totalAssignmentsCreated: releaseDataSummary.totalAssignmentsCreated + candidateSysAdminSummary.totalAssignmentsCreated,
      failedUserIds: [...releaseDataSummary.failedUserIds, ...candidateSysAdminSummary.failedUserIds],
      errorMessages: [...releaseDataSummary.errorMessages, ...candidateSysAdminSummary.errorMessages],
    };
    
    return mergedSummary;
  }

  @Post('migrate-phone-last-4-digits')
  @ApiOperation({
    summary: 'Migrate phone last 4 digits for existing users',
    description: 'Gets all users, decrypts their phone numbers from encrypted_user_data, and extracts/saves the last 4 digits to users.phone_last_4_digits',
    operationId: 'migratePhoneLast4Digits',
  })
  @ApiResponse({
    status: 201,
    description: 'Migration completed successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total users processed' },
        updated: { type: 'number', description: 'Users updated with phone_last_4_digits' },
        skipped: { type: 'number', description: 'Users skipped (already have phone_last_4_digits or no phone)' },
        errors: { type: 'number', description: 'Number of errors encountered' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async migratePhoneLast4Digits(): Promise<{ total: number; updated: number; skipped: number; errors: number }> {
    return await this.migrationService.migratePhoneLast4Digits();
  }

  @Post('migrate-user-education-major-ids')
  @ApiOperation({
    summary: 'Migrate major_id for user educations',
    description: 'Gets all user educations with major_id null but major string not empty, finds or creates majors, and updates major_id',
    operationId: 'migrateUserEducationMajorIds',
  })
  @ApiResponse({
    status: 201,
    description: 'Migration completed successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total educations found to process' },
        updated: { type: 'number', description: 'Educations successfully updated with major_id' },
        created: { type: 'number', description: 'New majors created' },
        skipped: { type: 'number', description: 'Educations skipped (empty major after trim)' },
        errors: { type: 'number', description: 'Number of errors encountered' },
      },
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async migrateUserEducationMajorIds(): Promise<{ total: number; updated: number; created: number; skipped: number; errors: number }> {
    return await this.migrationService.migrateUserEducationMajorIds();
  }
}

