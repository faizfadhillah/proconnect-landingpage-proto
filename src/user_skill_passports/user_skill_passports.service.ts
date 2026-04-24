// src\user_certificates\user_certificates.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserSkillPassportDto } from "./dto/create-user_skill_passport.dto";
import { UpdateUserSkillPassportDto } from "./dto/update-user_skill_passport.dto";
import {
  StatusSkillPassport,
  UserSkillPassport,
} from "./entities/user_skill_passport.entity";
import { User } from "src/users/entities/user.entity";

@Injectable()
export class UserSkillPassportsService {
  constructor(
    @InjectRepository(UserSkillPassport)
    private userSkillPassportRepository: Repository<UserSkillPassport>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createUserSkillPassportDto: CreateUserSkillPassportDto,
  ): Promise<UserSkillPassport> {
    let userSkillPassport = this.userSkillPassportRepository.create(
      createUserSkillPassportDto,
    );
    userSkillPassport =
      await this.userSkillPassportRepository.save(userSkillPassport);
    await this.updateIsSkillPassportVerifiedStatus(userSkillPassport);
    return userSkillPassport;
  }

  async findOne(id: string): Promise<UserSkillPassport> {
    const userSkillPassport = await this.userSkillPassportRepository.findOne({
      where: { id },
    });
    if (!userSkillPassport) {
      throw new NotFoundException(`UserSkillPassport with ID ${id} not found`);
    }
    return userSkillPassport;
  }

  async update(
    id: string,
    updateUserSkillPassportDto: UpdateUserSkillPassportDto,
  ): Promise<UserSkillPassport> {
    let userSkillPassport = await this.findOne(id);
    Object.assign(userSkillPassport, updateUserSkillPassportDto);
    userSkillPassport =
      await this.userSkillPassportRepository.save(userSkillPassport);
    await this.updateIsSkillPassportVerifiedStatus(userSkillPassport);
    return userSkillPassport;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userSkillPassportRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserSkillPassport with ID ${id} not found`);
    }
  }

  async updateIsSkillPassportVerifiedStatus(
    userSkillPassport: UserSkillPassport,
  ) {
    const user = await this.userRepository.findOneBy({
      id: userSkillPassport.user_id,
    });

    const userSkillPassports = await this.userSkillPassportRepository.findBy({
      user_id: user.id,
    });

    if (userSkillPassports.length === 0) {
      user.is_skill_passport_verified = null;
    } else {
      user.is_skill_passport_verified = userSkillPassports.some(
        (passport) => passport.status === StatusSkillPassport.VERIFIED,
      )
        ? true
        : false;
    }

    await this.userRepository.save(user);
  }
}
