// src\mst_schools\mst_schools.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstSchoolDto } from "./dto/create-mst_school.dto";
import { UpdateMstSchoolDto } from "./dto/update-mst_school.dto";
import { MstSchool } from "./entities/mst_school.entity";
import { BasePagination } from "src/base.pagination";

interface SearchMstSchoolsParams {
  id?: string;
  name?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class MstSchoolsService {
  constructor(
    @InjectRepository(MstSchool)
    private mstSchoolRepository: Repository<MstSchool>,
  ) {}

  async create(createMstSchoolDto: CreateMstSchoolDto): Promise<MstSchool> {
    const mstSchool = this.mstSchoolRepository.create(createMstSchoolDto);
    return await this.mstSchoolRepository.save(mstSchool);
  }

  async update(
    id: string,
    updateMstSchoolDto: UpdateMstSchoolDto,
  ): Promise<MstSchool> {
    const mstSchool = await this.mstSchoolRepository.findOne({
      where: { id },
    });
    if (!mstSchool) {
      throw new NotFoundException(`School level with ID ${id} not found`);
    }
    Object.assign(mstSchool, updateMstSchoolDto);
    return await this.mstSchoolRepository.save(mstSchool);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstSchoolRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`School level with ID ${id} not found`);
    }
  }

  async search(
    params: SearchMstSchoolsParams,
  ): Promise<BasePagination<MstSchool>> {
    const { id, name, page = 1, limit = 10 } = params;

    const query = this.mstSchoolRepository.createQueryBuilder("mst_school");
    query.leftJoinAndSelect("mst_school.region", "region");

    if (id) {
      query.andWhere("mst_school.id = :id", { id });
    }

    if (name) {
      query.andWhere("mst_school.level ILIKE :level", {
        name: `%${name}%`,
      });
    }

    query.skip((page - 1) * limit).take(limit);
    query.orderBy("mst_school.name", "ASC");

    const [items, total] = await query.getManyAndCount();

    const paginationResult = new BasePagination<MstSchool>();
    paginationResult.items = items;
    paginationResult.meta = {
      total: total,
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
    };

    return paginationResult;
  }
}
