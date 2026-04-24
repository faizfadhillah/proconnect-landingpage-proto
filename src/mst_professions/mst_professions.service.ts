// src\mst_professions\mst_professions.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstProfessionDto } from "./dto/create-mst_profession.dto";
import { UpdateMstProfessionDto } from "./dto/update-mst_profession.dto";
import { MstProfession } from "./entities/mst_profession.entity";

@Injectable()
export class MstProfessionsService {
  constructor(
    @InjectRepository(MstProfession)
    private mstProfessionRepository: Repository<MstProfession>,
  ) {}

  async create(
    createMstProfessionDto: CreateMstProfessionDto,
  ): Promise<MstProfession> {
    const mstProfession = this.mstProfessionRepository.create(
      createMstProfessionDto,
    );
    return await this.mstProfessionRepository.save(mstProfession);
  }

  async update(
    id: string,
    updateMstProfessionDto: UpdateMstProfessionDto,
  ): Promise<MstProfession> {
    const mstProfession = await this.mstProfessionRepository.findOne({
      where: { id },
    });
    if (!mstProfession) {
      throw new NotFoundException(`MstProfession with ID ${id} not found`);
    }
    Object.assign(mstProfession, updateMstProfessionDto);
    return await this.mstProfessionRepository.save(mstProfession);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstProfessionRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MstProfession with ID ${id} not found`);
    }
  }

  async findOne(id: string): Promise<MstProfession> {
    const mstProfession = await this.mstProfessionRepository.findOne({ where: { id } });
    if (!mstProfession) {
      throw new NotFoundException(`MstProfession with ID ${id} not found`);
    }
    return mstProfession;
  }
}
