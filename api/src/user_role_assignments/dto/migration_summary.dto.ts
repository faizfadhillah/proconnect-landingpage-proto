import { ApiProperty } from '@nestjs/swagger';

export class MigrationSummaryDto {
  @ApiProperty({
    description: 'Total users found in the system',
    example: 100,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Users skipped (already have role assignments)',
    example: 20,
  })
  usersSkipped: number;

  @ApiProperty({
    description: 'Users successfully migrated',
    example: 75,
  })
  usersMigrated: number;

  @ApiProperty({
    description: 'Users failed to migrate',
    example: 5,
  })
  usersFailed: number;

  @ApiProperty({
    description: 'Total role assignments created',
    example: 150,
  })
  totalAssignmentsCreated: number;

  @ApiProperty({
    description: 'List of user IDs that failed to migrate',
    example: ['uuid1', 'uuid2'],
  })
  failedUserIds: string[];

  @ApiProperty({
    description: 'Error messages for failed migrations',
    example: ['User uuid1: Company not found', 'User uuid2: Invalid role'],
  })
  errorMessages: string[];
}
