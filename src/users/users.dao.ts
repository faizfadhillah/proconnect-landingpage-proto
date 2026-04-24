import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, IsNull } from "typeorm";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersDao {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find users by multiple emails
   */
  async findByEmails(emails: string[]): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        email: In(emails),
        deleted_at: null, // Only active users
      },
    });
  }

  /**
   * Find all active users (for Phase 5 - Phone-only matching)
   * Note: This is inefficient but necessary for phone matching since phone is encrypted
   */
  async findAllActive(): Promise<User[]> {
    return await this.userRepository.find({
      where: { deleted_at: null },
    });
  }

  /**
   * Find one active user by ID
   */
  async findOneActive(userId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: userId, deleted_at: null },
    });
  }

  /**
   * Find active users by email or phone_last_4_digits
   * Used for informal certificate mapping to narrow down candidates
   */
  async findByEmailOrPhoneLast4Digits(
    email?: string | null,
    phoneLast4Digits?: string | null
  ): Promise<User[]> {
    const whereConditions: any = {
      deleted_at: IsNull(),
    };

    if (email && phoneLast4Digits) {
      // Both conditions: email OR phone_last_4_digits
      return await this.userRepository
        .createQueryBuilder('user')
        .where('user.deleted_at IS NULL')
        .andWhere('(user.email = :email OR user.phone_last_4_digits = :phoneLast4)', {
          email,
          phoneLast4: phoneLast4Digits,
        })
        .getMany();
    } else if (email) {
      whereConditions.email = email;
    } else if (phoneLast4Digits) {
      whereConditions.phone_last_4_digits = phoneLast4Digits;
    } else {
      // No filter provided, return empty array
      return [];
    }

    return await this.userRepository.find({ where: whereConditions });
  }
}