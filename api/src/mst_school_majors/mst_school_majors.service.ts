import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { CreateMstSchoolMajorDto } from "./dto/create-mst_school_major.dto";
import { UpdateMstSchoolMajorDto } from "./dto/update-mst_school_major.dto";
import { MstSchoolMajor } from "./entities/mst_school_major.entity";
import { MstSchoolMajorDao } from "./dao/mst_school_major.dao";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MstSchool } from "src/mst_schools/entities/mst_school.entity";
import { MstMajor } from "src/mst_majors/entities/mst_major.entity";

@Injectable()
export class MstSchoolMajorsService {
  constructor(
    private readonly mstSchoolMajorDao: MstSchoolMajorDao,
    @InjectRepository(MstSchool)
    private mstSchoolRepository: Repository<MstSchool>,
    @InjectRepository(MstMajor)
    private mstMajorRepository: Repository<MstMajor>,
  ) {}

  async create(createMstSchoolMajorDto: CreateMstSchoolMajorDto): Promise<MstSchoolMajor> {
    // Validate FK: Check if school exists
    const school = await this.mstSchoolRepository.findOne({
      where: { id: createMstSchoolMajorDto.school_id },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${createMstSchoolMajorDto.school_id} not found`);
    }

    // Validate FK: Check if major exists
    const major = await this.mstMajorRepository.findOne({
      where: { id: createMstSchoolMajorDto.major_id },
    });
    if (!major) {
      throw new NotFoundException(`Major with ID ${createMstSchoolMajorDto.major_id} not found`);
    }

    // Check for duplicate combination
    const existing = await this.mstSchoolMajorDao.findBySchoolAndMajor(
      createMstSchoolMajorDto.school_id,
      createMstSchoolMajorDto.major_id,
    );
    if (existing) {
      throw new ConflictException(
        `School-Major relation already exists for school ${createMstSchoolMajorDto.school_id} and major ${createMstSchoolMajorDto.major_id}`,
      );
    }

    return await this.mstSchoolMajorDao.create(createMstSchoolMajorDto);
  }

  async findOne(id: string): Promise<MstSchoolMajor> {
    const mstSchoolMajor = await this.mstSchoolMajorDao.findById(id);
    if (!mstSchoolMajor) {
      throw new NotFoundException(`School-Major relation with ID ${id} not found`);
    }
    return mstSchoolMajor;
  }

  async findBySchool(schoolId: string): Promise<MstSchoolMajor[]> {
    // Validate FK: Check if school exists
    const school = await this.mstSchoolRepository.findOne({
      where: { id: schoolId },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${schoolId} not found`);
    }

    return await this.mstSchoolMajorDao.findBySchool(schoolId);
  }

  async findByMajor(majorId: string): Promise<MstSchoolMajor[]> {
    // Validate FK: Check if major exists
    const major = await this.mstMajorRepository.findOne({
      where: { id: majorId },
    });
    if (!major) {
      throw new NotFoundException(`Major with ID ${majorId} not found`);
    }

    return await this.mstSchoolMajorDao.findByMajor(majorId);
  }

  async update(
    id: string,
    updateMstSchoolMajorDto: UpdateMstSchoolMajorDto,
  ): Promise<MstSchoolMajor> {
    const existing = await this.findOne(id);

    // Determine final values (use update value if provided, otherwise keep existing)
    const finalSchoolId = updateMstSchoolMajorDto.school_id ?? existing.school_id;
    const finalMajorId = updateMstSchoolMajorDto.major_id ?? existing.major_id;

    // Validate FK if school_id is being updated
    if (updateMstSchoolMajorDto.school_id) {
      const school = await this.mstSchoolRepository.findOne({
        where: { id: updateMstSchoolMajorDto.school_id },
      });
      if (!school) {
        throw new NotFoundException(`School with ID ${updateMstSchoolMajorDto.school_id} not found`);
      }
    }

    // Validate FK if major_id is being updated
    if (updateMstSchoolMajorDto.major_id) {
      const major = await this.mstMajorRepository.findOne({
        where: { id: updateMstSchoolMajorDto.major_id },
      });
      if (!major) {
        throw new NotFoundException(`Major with ID ${updateMstSchoolMajorDto.major_id} not found`);
      }
    }

    // Check for duplicate combination if either field is being updated
    const isSchoolIdChanged = updateMstSchoolMajorDto.school_id !== undefined;
    const isMajorIdChanged = updateMstSchoolMajorDto.major_id !== undefined;
    
    if (isSchoolIdChanged || isMajorIdChanged) {
      const duplicate = await this.mstSchoolMajorDao.findBySchoolAndMajor(
        finalSchoolId,
        finalMajorId,
      );
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `School-Major relation already exists for school ${finalSchoolId} and major ${finalMajorId}`,
        );
      }
    }

    return await this.mstSchoolMajorDao.update(id, updateMstSchoolMajorDto);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Check if exists
    await this.mstSchoolMajorDao.softDelete(id);
  }
}

