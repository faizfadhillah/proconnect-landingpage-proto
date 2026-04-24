// src\user_skills\user_skills.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserLanguageDto } from "./dto/create-user_language.dto";
import { UpdateUserLanguageDto } from "./dto/update-user_language.dto";
import { UserLanguage } from "./entities/user_language.entity";

@Injectable()
export class UserLanguagesService {
  constructor(
    @InjectRepository(UserLanguage)
    private userLanguageRepository: Repository<UserLanguage>,
  ) {}

  async create(
    createUserSkillDto: CreateUserLanguageDto,
  ): Promise<UserLanguage> {
    const userLanguage = this.userLanguageRepository.create(createUserSkillDto);
    return await this.userLanguageRepository.save(userLanguage);
  }

  async findAll(): Promise<UserLanguage[]> {
    return await this.userLanguageRepository.find();
  }

  async findOne(id: string): Promise<UserLanguage> {
    const userLanguage = await this.userLanguageRepository.findOne({
      where: { id },
    });
    if (!userLanguage) {
      throw new NotFoundException(`UserLanguage with ID ${id} not found`);
    }
    return userLanguage;
  }

  async update(
    id: string,
    updateUserLanguageDto: UpdateUserLanguageDto,
  ): Promise<UserLanguage> {
    const userLanguage = await this.findOne(id);
    Object.assign(userLanguage, updateUserLanguageDto);
    return await this.userLanguageRepository.save(userLanguage);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userLanguageRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserLanguage with ID ${id} not found`);
    }
  }
}
