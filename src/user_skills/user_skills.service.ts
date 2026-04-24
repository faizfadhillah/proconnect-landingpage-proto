// src\user_skills\user_skills.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserSkillDto } from "./dto/create-user_skill.dto";
import { UpdateUserSkillDto } from "./dto/update-user_skill.dto";
import { UserSkill } from "./entities/user_skill.entity";
import { UserSkillDao } from "./dao/user_skill.dao";
import { ApprovalState } from "../common/enums/approval-state.enum";
import { RetroactiveLicenseSkillQueuePublisher } from "../queues/publishers/retroactive-license-skill-queue.publisher";

@Injectable()
export class UserSkillsService {
  constructor(
    @InjectRepository(UserSkill)
    private userSkillRepository: Repository<UserSkill>,
    private readonly dao: UserSkillDao,
    private readonly retroactiveLicenseSkillQueuePublisher: RetroactiveLicenseSkillQueuePublisher,
  ) {}

  

  async create(createUserSkillDto: CreateUserSkillDto): Promise<UserSkill> {
    // Guard: Check for duplicate user_id + skill_id combination
    await this.validateUniqueUserSkill(
      createUserSkillDto.user_id,
      createUserSkillDto.skill_id,
    );

    const userSkill = this.userSkillRepository.create(createUserSkillDto);
    // Manual create → Set approval_state=WAITING_APPROVAL, approval_by=NULL
    // Auto-granted skills (via grantVerifiedSkill) will set APPROVED
    userSkill.approval_state = ApprovalState.WAITING_APPROVAL;
    userSkill.approval_by = null;
    const saved = await this.userSkillRepository.save(userSkill);

    // Check if user has verified certificates that should grant this skill
    await this.retroactiveLicenseSkillQueuePublisher.publishSkillJob(
      saved.user_id,
      saved.skill_id,
    );

    return saved;
  }

  async findAll(): Promise<UserSkill[]> {
    return await this.userSkillRepository.find();
  }

  async findOne(id: string): Promise<UserSkill> {
    const userSkill = await this.userSkillRepository.findOne({ where: { id } });
    if (!userSkill) {
      throw new NotFoundException(`UserSkill with ID ${id} not found`);
    }
    return userSkill;
  }

  async update(
    id: string,
    updateUserSkillDto: UpdateUserSkillDto,
  ): Promise<UserSkill> {
    const userSkill = await this.findOne(id);
    
    // Only prevent edit if approval_state=APPROVED
    // All other states (WAITING_APPROVAL, REJECT, etc.) can be edited
    if (userSkill.approval_state === ApprovalState.APPROVED) {
      throw new BadRequestException(
        `Cannot update UserSkill with ID ${id} because approval_state is ${userSkill.approval_state}. Only APPROVED records cannot be edited.`,
      );
    }
    
    // Defensive: ignore is_verified and approval fields if somehow provided
    const { is_verified, approval_state, approval_by, ...updateData } = updateUserSkillDto as any;
    
    // Guard: Check for duplicate if user_id or skill_id is being changed
    const newUserId = updateData.user_id ?? userSkill.user_id;
    const newSkillId = updateData.skill_id ?? userSkill.skill_id;
    
    if (newUserId !== userSkill.user_id || newSkillId !== userSkill.skill_id) {
      await this.validateUniqueUserSkill(newUserId, newSkillId, id);
    }
    
    Object.assign(userSkill, updateData);
    return await this.userSkillRepository.save(userSkill);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userSkillRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserSkill with ID ${id} not found`);
    }
  }

  /**
   * PUBLIC METHOD: Grant verified skill to user
   * Used by: Certificate verification, Retroactive processing
   * This method is centralized to avoid code duplication
   */
  async grantVerifiedSkill(
    userId: string,
    skillId: string
  ): Promise<UserSkill> {
    // Check if user already has this skill (use DAO - Service -> DAO -> Repository pattern)
    const existingSkill = await this.dao.findByUserAndSkill(userId, skillId);

    if (existingSkill) {
      // Update to approved
      if (existingSkill.approval_state !== ApprovalState.APPROVED) {
        existingSkill.approval_state = ApprovalState.APPROVED;
        existingSkill.approval_by = 'system';
        existingSkill.is_verified = true; // FE use this field to check if the skill is verified
        return await this.userSkillRepository.save(existingSkill);
      }
      return existingSkill;
    } else {
      // Create new user skill with approval_state=APPROVED for internal grants
      const newSkill = this.userSkillRepository.create({
        user_id: userId,
        skill_id: skillId,
      });
      newSkill.approval_state = ApprovalState.APPROVED;
      newSkill.approval_by = 'system';
      newSkill.is_verified = true; // FE use this field to check if the skill is verified
      return await this.userSkillRepository.save(newSkill);
    }
  }

  /**
   * PUBLIC METHOD: Revoke verified skill from user
   * Used by: Education unverification
   * This method is centralized to avoid code duplication
   */
  async revokeVerifiedSkill(
    userId: string,
    skillId: string,
    approvalBy: string = "system",
  ): Promise<UserSkill | null> {
    // Check if user has this skill
    const existingSkill = await this.dao.findByUserAndSkill(userId, skillId);

    if (existingSkill) {
      // Only revoke if currently APPROVED
      if (existingSkill.approval_state === ApprovalState.APPROVED) {
        existingSkill.approval_state = ApprovalState.REJECT;
        existingSkill.approval_by = approvalBy;
        existingSkill.is_verified = false;
        return await this.userSkillRepository.save(existingSkill);
      }
      return existingSkill;
    }
    return null;
  }

  /**
   * Validate that user_id + skill_id combination is unique
   * @param userId User ID
   * @param skillId Skill ID
   * @param excludeId Optional ID to exclude from check (for update operations)
   * @throws ConflictException if duplicate found
   */
  private async validateUniqueUserSkill(
    userId: string,
    skillId: string,
    excludeId?: string,
  ): Promise<void> {
    const existingSkill = await this.dao.findByUserAndSkill(userId, skillId);

    if (existingSkill && existingSkill.id !== excludeId) {
      throw new ConflictException(
        `User skill already exists for user_id ${userId} and skill_id ${skillId}`,
      );
    }
  }
}