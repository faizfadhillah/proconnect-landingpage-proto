import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstRightToWorkDto } from "./dto/create-mst_right_to_work.dto";
import { UpdateMstRightToWorkDto } from "./dto/update-mst_right_to_work.dto";
import { MstRightToWork } from "./entities/mst_right_to_work.entity";

@Injectable()
export class MstRightToWorksService {
  constructor(
    @InjectRepository(MstRightToWork)
    private readonly mstRightToWorksRepository: Repository<MstRightToWork>,
  ) {}

  async create(
    createMstRightToWorkDto: CreateMstRightToWorkDto,
  ): Promise<MstRightToWork> {
    const mstRightToWork = this.mstRightToWorksRepository.create(
      createMstRightToWorkDto,
    );
    return await this.mstRightToWorksRepository.save(mstRightToWork);
  }

  async findAll(): Promise<MstRightToWork[]> {
    return await this.mstRightToWorksRepository.find();
  }

  async findOne(code: string): Promise<MstRightToWork> {
    return await this.mstRightToWorksRepository.findOne({ where: { code } });
  }

  async update(
    id: string,
    updateMstRightToWorkDto: UpdateMstRightToWorkDto,
  ): Promise<MstRightToWork> {
    await this.mstRightToWorksRepository.update(id, updateMstRightToWorkDto);
    return await this.mstRightToWorksRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstRightToWorksRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MstRightToWork with ID ${id} not found`);
    }
  }
}
