// src/mst-regions/mst-regions.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstRegionDto } from "./dto/create-mst_region.dto";
import { UpdateMstRegionDto } from "./dto/update-mst_region.dto";
import { MstRegion } from "./entities/mst_region.entity";

@Injectable()
export class MstRegionsService {
  constructor(
    @InjectRepository(MstRegion)
    private mstRegionRepository: Repository<MstRegion>,
  ) {}

  async create(createMstRegionDto: CreateMstRegionDto): Promise<MstRegion> {
    const region = this.mstRegionRepository.create(createMstRegionDto);
    return await this.mstRegionRepository.save(region);
  }

  async findAll(): Promise<MstRegion[]> {
    return await this.mstRegionRepository.find({
      relations: ["parent"],
    });
  }

  async findOne(id: string): Promise<MstRegion> {
    const region = await this.mstRegionRepository.findOne({
      where: { id },
      relations: ["parent"],
    });
    if (!region) {
      throw new NotFoundException(`Master Region with ID ${id} not found`);
    }
    return region;
  }

  async update(
    id: string,
    updateMstRegionDto: UpdateMstRegionDto,
  ): Promise<MstRegion> {
    const region = await this.findOne(id);
    Object.assign(region, updateMstRegionDto);
    return await this.mstRegionRepository.save(region);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstRegionRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Master Region with ID ${id} not found`);
    }
  }
}
