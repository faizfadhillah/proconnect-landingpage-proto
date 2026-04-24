import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstAspCompetencyDto } from "./dto/create-mst_asp_competency.dto";
import { UpdateMstAspCompetencyDto } from "./dto/update-mst_asp_competency.dto";
import { MstAspCompetency } from "./entities/mst_asp_competency.entity";

@Injectable()
export class MstAspCompetenciesService {
  constructor(
    @InjectRepository(MstAspCompetency)
    private mstTagRepository: Repository<MstAspCompetency>,
  ) {}

  async create(
    createMstAspCompetencyDto: CreateMstAspCompetencyDto,
  ): Promise<MstAspCompetency> {
    const mstTag = this.mstTagRepository.create(createMstAspCompetencyDto);
    return await this.mstTagRepository.save(mstTag);
  }

  async findAll(): Promise<MstAspCompetency[]> {
    return await this.mstTagRepository.find();
  }

  async findOne(id: string): Promise<MstAspCompetency> {
    const mstTag = await this.mstTagRepository.findOne({ where: { id } });
    if (!mstTag) {
      throw new NotFoundException(`MstAspCompetency with ID ${id} not found`);
    }
    return mstTag;
  }

  async update(
    id: string,
    updateMstAspCompetencyDto: UpdateMstAspCompetencyDto,
  ): Promise<MstAspCompetency> {
    const mstTag = await this.findOne(id);
    Object.assign(mstTag, updateMstAspCompetencyDto);
    return await this.mstTagRepository.save(mstTag);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstTagRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MstAspCompetency with ID ${id} not found`);
    }
  }
}
