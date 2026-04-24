// src\user_SalaryCountry\user_SalaryCountry.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserSalaryCountryDto } from "./dto/create-user_salary_country.dto";
import { UpdateUserSalaryCountryDto } from "./dto/update-user_salary_country.dto";
import { UserSalaryCountry } from "./entities/user_salary_country.entity";

@Injectable()
export class UserSalaryCountryService {
  constructor(
    @InjectRepository(UserSalaryCountry)
    private userSalaryCountryRepository: Repository<UserSalaryCountry>,
  ) {}

  async create(
    createUserSalaryCountryDto: CreateUserSalaryCountryDto,
  ): Promise<UserSalaryCountry> {
    const userSalaryCountry = this.userSalaryCountryRepository.create(
      createUserSalaryCountryDto,
    );
    return await this.userSalaryCountryRepository.save(userSalaryCountry);
  }

  async findAll(): Promise<UserSalaryCountry[]> {
    return await this.userSalaryCountryRepository.find();
  }

  async findOne(id: string): Promise<UserSalaryCountry> {
    const userSalaryCountry = await this.userSalaryCountryRepository.findOne({
      where: { id },
    });
    if (!userSalaryCountry) {
      throw new NotFoundException(`UserSalaryCountry with ID ${id} not found`);
    }
    return userSalaryCountry;
  }

  async update(
    id: string,
    updateUserSalaryCountryDto: UpdateUserSalaryCountryDto,
  ): Promise<UserSalaryCountry> {
    const userSalaryCountry = await this.findOne(id);
    Object.assign(userSalaryCountry, updateUserSalaryCountryDto);
    return await this.userSalaryCountryRepository.save(userSalaryCountry);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userSalaryCountryRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserSalaryCountry with ID ${id} not found`);
    }
  }
}
