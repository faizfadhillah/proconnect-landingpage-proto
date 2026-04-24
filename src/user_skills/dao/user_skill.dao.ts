import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager, IsNull } from "typeorm";
import { UserSkill } from "../entities/user_skill.entity";

@Injectable()
export class UserSkillDao {
  constructor(
    @InjectRepository(UserSkill)
    private repository: Repository<UserSkill>,
  ) {}

  /**
   * Find user skill by user ID and skill ID
   */
  async findByUserAndSkill(
    userId: string,
    skillId: string,
    manager?: EntityManager
  ): Promise<UserSkill | null> {
    const repo = manager ? manager.getRepository(UserSkill) : this.repository;
    return repo.findOne({
      where: {
        user_id: userId,
        skill_id: skillId,
        deleted_at: IsNull(),
      },
    });
  }
}

