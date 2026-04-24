// src\mst_skills\mst_skills.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstInterestDto } from "./dto/create-mst_interest.dto";
import { UpdateMstInterestDto } from "./dto/update-mst_interest.dto";
import { MstInterest } from "./entities/mst_interest.entity";

@Injectable()
export class MstInterestsService {
  constructor(
    @InjectRepository(MstInterest)
    private mstInterestRepository: Repository<MstInterest>,
  ) {}

  async create(
    createMstInterestDto: CreateMstInterestDto,
  ): Promise<MstInterest> {
    const mstInterest = this.mstInterestRepository.create(createMstInterestDto);
    return await this.mstInterestRepository.save(mstInterest);
  }

  async update(
    id: string,
    updateMstInterestDto: UpdateMstInterestDto,
  ): Promise<MstInterest> {
    const mstInterest = await this.findOne(id);
    Object.assign(mstInterest, updateMstInterestDto);
    return await this.mstInterestRepository.save(mstInterest);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstInterestRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MstInterest with ID ${id} not found`);
    }
  }

  async findOne(id: string): Promise<MstInterest> {
    const mstInterest = await this.mstInterestRepository.findOne({
      where: { id },
    });
    if (!mstInterest) {
      throw new NotFoundException(`MstInterest with ID ${id} not found`);
    }
    return mstInterest;
  }
}
