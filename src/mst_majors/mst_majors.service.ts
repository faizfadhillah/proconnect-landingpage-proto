import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { CreateMstMajorDto } from "./dto/create-mst_major.dto";
import { UpdateMstMajorDto } from "./dto/update-mst_major.dto";
import { MstMajor } from "./entities/mst_major.entity";
import { MstMajorDao } from "./dao/mst_major.dao";

@Injectable()
export class MstMajorsService {
  constructor(
    private readonly mstMajorDao: MstMajorDao,
  ) {}

  async create(createMstMajorDto: CreateMstMajorDto): Promise<MstMajor> {
    // Check for duplicate major name
    const existingMajor = await this.mstMajorDao.findByName(createMstMajorDto.major_name);
    if (existingMajor) {
      throw new ConflictException(`Major with name '${createMstMajorDto.major_name}' already exists`);
    }
    
    return await this.mstMajorDao.create(createMstMajorDto);
  }

  async findOne(id: string): Promise<MstMajor> {
    const mstMajor = await this.mstMajorDao.findById(id);
    if (!mstMajor) {
      throw new NotFoundException(`Major with ID ${id} not found`);
    }
    return mstMajor;
  }

  async update(
    id: string,
    updateMstMajorDto: UpdateMstMajorDto,
  ): Promise<MstMajor> {
    const existingMajor = await this.findOne(id);
    
    // Check for duplicate major name if name is being updated
    if (updateMstMajorDto.major_name && updateMstMajorDto.major_name !== existingMajor.major_name) {
      const duplicateMajor = await this.mstMajorDao.findByName(updateMstMajorDto.major_name);
      if (duplicateMajor) {
        throw new ConflictException(`Major with name '${updateMstMajorDto.major_name}' already exists`);
      }
    }
    
    return await this.mstMajorDao.update(id, updateMstMajorDto);
  }

  async remove(id: string): Promise<void> {
    await this.mstMajorDao.softDelete(id);
  }
}