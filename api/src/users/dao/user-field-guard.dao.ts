import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserFieldGuard } from "../entities/user_field_guard.entity";
import { UserFieldGuardType } from "../enums/user-field-guard-type.enum";

@Injectable()
export class UserFieldGuardDao {
  constructor(
    @InjectRepository(UserFieldGuard)
    private readonly repository: Repository<UserFieldGuard>,
  ) {}

  async findByUserAndType(
    userId: string,
    type: UserFieldGuardType,
  ): Promise<UserFieldGuard | null> {
    return this.repository.findOne({
      where: { user_id: userId, type },
    });
  }

  async upsert(
    userId: string,
    type: UserFieldGuardType,
    guardedUntil: Date,
    identifier?: string,
  ): Promise<UserFieldGuard> {
    const existing = await this.findByUserAndType(userId, type);
    if (existing) {
      existing.guarded_until = guardedUntil;
      existing.identifier = identifier ?? null;
      return this.repository.save(existing);
    }
    const guard = this.repository.create({
      user_id: userId,
      type,
      guarded_until: guardedUntil,
      identifier: identifier ?? null,
    });
    return this.repository.save(guard);
  }
}
