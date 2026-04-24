// src\mst_skills\mst_skills.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstSalaryCountryDto } from "./dto/create-mst_salary_country.dto";
import { UpdateMstSalaryCountryDto } from "./dto/update-mst_salary_country.dto";
import { MstSalaryCountry } from "./entities/mst_salary_country.entity";

@Injectable()
export class MstSalaryCountryService {
  constructor(
    @InjectRepository(MstSalaryCountry)
    private mstSalaryCountryRepository: Repository<MstSalaryCountry>,
  ) {}

  async create(
    createMstSalaryCountryDto: CreateMstSalaryCountryDto,
  ): Promise<MstSalaryCountry> {
    const mstSalaryCountry = this.mstSalaryCountryRepository.create(
      createMstSalaryCountryDto,
    );
    return await this.mstSalaryCountryRepository.save(mstSalaryCountry);
  }

  async update(
    id: string,
    updateMstSalaryCountryDto: UpdateMstSalaryCountryDto,
  ): Promise<MstSalaryCountry> {
    const mstSalaryCountry = await this.findOne(id);
    Object.assign(mstSalaryCountry, updateMstSalaryCountryDto);
    return await this.mstSalaryCountryRepository.save(mstSalaryCountry);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstSalaryCountryRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MstSalaryCountry with ID ${id} not found`);
    }
  }

  async findOne(id: string): Promise<MstSalaryCountry> {
    const mstSalaryCountry = await this.mstSalaryCountryRepository.findOne({
      where: { id },
    });
    if (!mstSalaryCountry) {
      throw new NotFoundException(`MstSalaryCountry with ID ${id} not found`);
    }
    return mstSalaryCountry;
  }
}
