import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { UserRoleAssignment } from '../entities/user_role_assignment.entity';
import { UserRoleAssignmentStatus, UserRoleAssignmentRole } from '../enums/user_role_assignment.enums';

@Injectable()
export class UserRoleAssignmentDao {
  constructor(
    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepository: Repository<UserRoleAssignment>,
  ) {}

  /**
   * Find active role assignments by user ID
   */
  async findByUserId(userId: string, manager?: EntityManager): Promise<UserRoleAssignment[]> {
    const repo = manager ? manager.getRepository(UserRoleAssignment) : this.userRoleAssignmentRepository;
    return repo.find({
      where: { 
        userId,
        status: UserRoleAssignmentStatus.ACTIVE,
      },
      relations: ['user', 'companyHq', 'company', 'department', 'profession', 'school'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Find active role assignments by user ID and role
   */
  async findActiveByUserIdAndRole(
    userId: string,
    role: UserRoleAssignmentRole,
    manager?: EntityManager
  ): Promise<UserRoleAssignment[]> {
    const repo = manager ? manager.getRepository(UserRoleAssignment) : this.userRoleAssignmentRepository;
    return repo.find({
      where: { 
        userId,
        role,
        status: UserRoleAssignmentStatus.ACTIVE,
      },
      relations: ['user', 'companyHq', 'company', 'department', 'profession', 'school'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Create role assignment
   */
  async create(assignment: Partial<UserRoleAssignment>, manager?: EntityManager): Promise<UserRoleAssignment> {
    const repo = manager ? manager.getRepository(UserRoleAssignment) : this.userRoleAssignmentRepository;
    const entity = repo.create(assignment);
    return repo.save(entity);
  }

  /**
   * Update role assignment
   */
  async update(id: string, updates: Partial<UserRoleAssignment>, manager?: EntityManager): Promise<UserRoleAssignment> {
    const repo = manager ? manager.getRepository(UserRoleAssignment) : this.userRoleAssignmentRepository;
    await repo.update(id, updates);
    const updated = await repo.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Role assignment not found after update');
    }
    return updated;
  }

  /**
   * Hard delete role assignment (use with caution)
   */
  async hardDelete(id: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(UserRoleAssignment) : this.userRoleAssignmentRepository;
    await repo.delete(id);
  }

  async findActiveByCompanyHqId(companyHqId: string): Promise<UserRoleAssignment[]> {
    return this.userRoleAssignmentRepository.find({
      where: { 
        companyHqId,
        status: UserRoleAssignmentStatus.ACTIVE,
      },
    });
  }

}
