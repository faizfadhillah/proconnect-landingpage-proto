import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserRoleAssignment } from 'src/user_role_assignments/entities/user_role_assignment.entity';

@Injectable()
export class MigrationDao {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRoleAssignment)
    private readonly userRoleAssignmentRepository: Repository<UserRoleAssignment>,
  ) {}

  /**
   * Get all users with role-related data for migration
   */
  async getAllUsersForMigration(): Promise<any[]> {
    return this.userRepository.find({
      where: { deleted_at: null },
      select: ['id', 'company_id', 'roles', 'user_role', 'company_role', 'employment_status', 'created_at']
    });
  }

  /**
   * Get all existing user IDs that already have role assignments
   */
  async getExistingUserAssignmentIds(): Promise<Set<string>> {
    const existingAssignments = await this.userRoleAssignmentRepository.find({
      where: { deleted_at: null },
      select: ['userId']
    });
    return new Set(existingAssignments.map(a => a.userId));
  }

  /**
   * Check if a user already has role assignments
   */
  async hasExistingAssignments(userId: string): Promise<boolean> {
    const count = await this.userRoleAssignmentRepository.count({
      where: { 
        userId: userId,
        deleted_at: null 
      }
    });
    return count > 0;
  }
}
