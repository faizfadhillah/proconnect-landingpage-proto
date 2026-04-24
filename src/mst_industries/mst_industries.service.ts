// src\mst_skills\mst_skills.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstIndustryDto } from "./dto/create-mst_industry.dto";
import { UpdateMstIndustryDto } from "./dto/update-mst_industry.dto";
import { MstIndustry } from "./entities/mst_industry.entity";

@Injectable()
export class MstIndustriesService {
  constructor(
    @InjectRepository(MstIndustry)
    private mstIndustryRepository: Repository<MstIndustry>,
  ) {}

  async create(
    createMstIndustryDto: CreateMstIndustryDto,
  ): Promise<MstIndustry> {
    const mstIndustry = this.mstIndustryRepository.create(createMstIndustryDto);
    return await this.mstIndustryRepository.save(mstIndustry);
  }

  async update(
    id: string,
    updateMstIndustryDto: UpdateMstIndustryDto,
  ): Promise<MstIndustry> {
    const mstIndustry = await this.findOne(id);
    Object.assign(mstIndustry, updateMstIndustryDto);
    return await this.mstIndustryRepository.save(mstIndustry);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstIndustryRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MstIndustry with ID ${id} not found`);
    }
  }

  async findOne(id: string): Promise<MstIndustry> {
    const mstIndustry = await this.mstIndustryRepository.findOne({
      where: { id },
    });
    if (!mstIndustry) {
      throw new NotFoundException(`MstIndustry with ID ${id} not found`);
    }
    return mstIndustry;
  }
}
