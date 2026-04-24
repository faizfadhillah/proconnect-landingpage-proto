// src\mst_skills\mst_skills.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstCountryDto } from "./dto/create-mst_country.dto";
import { UpdateMstCountryDto } from "./dto/update-mst_country.dto";
import { MstCountry } from "./entities/mst_country.entity";

@Injectable()
export class MstCountryService {
  constructor(
    @InjectRepository(MstCountry)
    private mstCountryRepository: Repository<MstCountry>,
  ) {}

  async create(createMstCountryDto: CreateMstCountryDto): Promise<MstCountry> {
    const mstCountry = this.mstCountryRepository.create(createMstCountryDto);
    return await this.mstCountryRepository.save(mstCountry);
  }

  async update(
    id: string,
    updateMstCountryDto: UpdateMstCountryDto,
  ): Promise<MstCountry> {
    const mstCountry = await this.findOne(id);
    Object.assign(mstCountry, updateMstCountryDto);
    return await this.mstCountryRepository.save(mstCountry);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstCountryRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MstCountry with ID ${id} not found`);
    }
  }

  async findOne(id: string): Promise<MstCountry> {
    const mstCountry = await this.mstCountryRepository.findOne({
      where: { id },
    });
    if (!mstCountry) {
      throw new NotFoundException(`MstCountry with ID ${id} not found`);
    }
    return mstCountry;
  }
}
