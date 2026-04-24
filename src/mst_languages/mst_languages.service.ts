// src\mst_skills\mst_skills.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstLanguageDto } from "./dto/create-mst_language.dto";
import { UpdateMstLanguageDto } from "./dto/update-mst_language.dto";
import { MstLanguage } from "./entities/mst_language.entity";

@Injectable()
export class MstLanguagesService {
  constructor(
    @InjectRepository(MstLanguage)
    private mstLanguageRepository: Repository<MstLanguage>,
  ) {}

  async create(createMstSkillDto: CreateMstLanguageDto): Promise<MstLanguage> {
    const mstSkill = this.mstLanguageRepository.create(createMstSkillDto);
    return await this.mstLanguageRepository.save(mstSkill);
  }

  async update(
    id: string,
    updateMstSkillDto: UpdateMstLanguageDto,
  ): Promise<MstLanguage> {
    const mstSkill = await this.findOne(id);
    Object.assign(mstSkill, updateMstSkillDto);
    return await this.mstLanguageRepository.save(mstSkill);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstLanguageRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MstSkill with ID ${id} not found`);
    }
  }

  async findOne(id: string): Promise<MstLanguage> {
    const mstSkill = await this.mstLanguageRepository.findOne({
      where: { id },
    });
    if (!mstSkill) {
      throw new NotFoundException(`MstSkill with ID ${id} not found`);
    }
    return mstSkill;
  }
}
