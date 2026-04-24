// src\user_professions\user_professions.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserProfessionDto } from "./dto/create-user_profession.dto";
import { UpdateUserProfessionDto } from "./dto/update-user_profession.dto";
import { UserProfession } from "./entities/user_profession.entity";

@Injectable()
export class UserProfessionsService {
  constructor(
    @InjectRepository(UserProfession)
    private userProfessionRepository: Repository<UserProfession>,
  ) {}

  async create(
    createUserProfessionDto: CreateUserProfessionDto,
  ): Promise<UserProfession> {
    const userProfession = this.userProfessionRepository.create(
      createUserProfessionDto,
    );
    return await this.userProfessionRepository.save(userProfession);
  }

  async update(
    id: string,
    updateUserProfessionDto: UpdateUserProfessionDto,
  ): Promise<UserProfession> {
    const userProfession = await this.userProfessionRepository.findOne({
      where: { id },
    });
    Object.assign(userProfession, updateUserProfessionDto);
    return await this.userProfessionRepository.save(userProfession);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userProfessionRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserProfession with ID ${id} not found`);
    }
  }
}
