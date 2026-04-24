// src\mst_skills\mst_skills.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstSkillDto } from "./dto/create-mst_skill.dto";
import { UpdateMstSkillDto } from "./dto/update-mst_skill.dto";
import { MstSkill } from "./entities/mst_skill.entity";

@Injectable()
export class MstSkillsService {
  constructor(
    @InjectRepository(MstSkill)
    private mstSkillRepository: Repository<MstSkill>,
  ) {}

  async create(createMstSkillDto: CreateMstSkillDto): Promise<MstSkill> {
    const mstSkill = this.mstSkillRepository.create(createMstSkillDto);
    return await this.mstSkillRepository.save(mstSkill);
  }

  async update(
    id: string,
    updateMstSkillDto: UpdateMstSkillDto,
  ): Promise<MstSkill> {
    const mstSkill = await this.findOne(id);
    Object.assign(mstSkill, updateMstSkillDto);
    return await this.mstSkillRepository.save(mstSkill);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstSkillRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MstSkill with ID ${id} not found`);
    }
  }

  async findOne(id: string): Promise<MstSkill> {
    const mstSkill = await this.mstSkillRepository.findOne({ where: { id } });
    if (!mstSkill) {
      throw new NotFoundException(`MstSkill with ID ${id} not found`);
    }
    return mstSkill;
  }
}
