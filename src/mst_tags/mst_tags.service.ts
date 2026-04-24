import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstTagDto } from "./dto/create-mst_tag.dto";
import { UpdateMstTagDto } from "./dto/update-mst_tag.dto";
import { MstTag } from "./entities/mst_tag.entity";

@Injectable()
export class MstTagsService {
  constructor(
    @InjectRepository(MstTag)
    private mstTagRepository: Repository<MstTag>,
  ) {}

  async create(createMstTagDto: CreateMstTagDto): Promise<MstTag> {
    const mstTag = this.mstTagRepository.create(createMstTagDto);
    return await this.mstTagRepository.save(mstTag);
  }

  async findAll(): Promise<MstTag[]> {
    return await this.mstTagRepository.find();
  }

  async findOne(id: string): Promise<MstTag> {
    const mstTag = await this.mstTagRepository.findOne({ where: { id } });
    if (!mstTag) {
      throw new NotFoundException(`MstTag with ID ${id} not found`);
    }
    return mstTag;
  }

  async update(id: string, updateMstTagDto: UpdateMstTagDto): Promise<MstTag> {
    const mstTag = await this.findOne(id);
    Object.assign(mstTag, updateMstTagDto);
    return await this.mstTagRepository.save(mstTag);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstTagRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MstTag with ID ${id} not found`);
    }
  }
}
