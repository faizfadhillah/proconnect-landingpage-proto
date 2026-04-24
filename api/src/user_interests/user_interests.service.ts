// src\user_Interests\user_Interests.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserInterestDto } from "./dto/create-user_interest.dto";
import { UpdateUserInterestDto } from "./dto/update-user_interest.dto";
import { UserInterest } from "./entities/user_interest.entity";

@Injectable()
export class UserInterestsService {
  constructor(
    @InjectRepository(UserInterest)
    private userInterestRepository: Repository<UserInterest>,
  ) {}

  async create(
    createUserInterestDto: CreateUserInterestDto,
  ): Promise<UserInterest> {
    const userInterest = this.userInterestRepository.create(
      createUserInterestDto,
    );
    return await this.userInterestRepository.save(userInterest);
  }

  async findAll(): Promise<UserInterest[]> {
    return await this.userInterestRepository.find();
  }

  async findOne(id: string): Promise<UserInterest> {
    const userInterest = await this.userInterestRepository.findOne({
      where: { id },
    });
    if (!userInterest) {
      throw new NotFoundException(`UserInterest with ID ${id} not found`);
    }
    return userInterest;
  }

  async update(
    id: string,
    updateUserInterestDto: UpdateUserInterestDto,
  ): Promise<UserInterest> {
    const userInterest = await this.findOne(id);
    Object.assign(userInterest, updateUserInterestDto);
    return await this.userInterestRepository.save(userInterest);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userInterestRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserInterest with ID ${id} not found`);
    }
  }
}
