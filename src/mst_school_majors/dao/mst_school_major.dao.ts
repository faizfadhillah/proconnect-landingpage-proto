import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { MstSchoolMajor } from '../entities/mst_school_major.entity';
import { CreateMstSchoolMajorDto } from '../dto/create-mst_school_major.dto';
import { UpdateMstSchoolMajorDto } from '../dto/update-mst_school_major.dto';

@Injectable()
export class MstSchoolMajorDao {
  constructor(
    @InjectRepository(MstSchoolMajor)
    private mstSchoolMajorRepository: Repository<MstSchoolMajor>,
  ) {}

  /**
   * Create a new school-major relation
   */
  async create(createMstSchoolMajorDto: CreateMstSchoolMajorDto, manager?: EntityManager): Promise<MstSchoolMajor> {
    const repo = manager ? manager.getRepository(MstSchoolMajor) : this.mstSchoolMajorRepository;
    const entity = repo.create(createMstSchoolMajorDto);
    return repo.save(entity);
  }

  /**
   * Find school-major by ID
   */
  async findById(id: string, manager?: EntityManager): Promise<MstSchoolMajor | null> {
    const repo = manager ? manager.getRepository(MstSchoolMajor) : this.mstSchoolMajorRepository;
    return repo.findOne({ where: { id } });
  }

  /**
   * Find all majors for a school
   */
  async findBySchool(schoolId: string, manager?: EntityManager): Promise<MstSchoolMajor[]> {
    const repo = manager ? manager.getRepository(MstSchoolMajor) : this.mstSchoolMajorRepository;
    return repo.find({ 
      where: { school_id: schoolId },
      relations: ['major'],
    });
  }

  /**
   * Find all schools offering a major
   */
  async findByMajor(majorId: string, manager?: EntityManager): Promise<MstSchoolMajor[]> {
    const repo = manager ? manager.getRepository(MstSchoolMajor) : this.mstSchoolMajorRepository;
    return repo.find({ 
      where: { major_id: majorId },
      relations: ['school'],
    });
  }

  /**
   * Find by school and major combination
   */
  async findBySchoolAndMajor(schoolId: string, majorId: string, manager?: EntityManager): Promise<MstSchoolMajor | null> {
    const repo = manager ? manager.getRepository(MstSchoolMajor) : this.mstSchoolMajorRepository;
    return repo.findOne({ 
      where: { 
        school_id: schoolId,
        major_id: majorId,
      },
    });
  }

  /**
   * Update school-major by ID
   */
  async update(id: string, updateMstSchoolMajorDto: UpdateMstSchoolMajorDto, manager?: EntityManager): Promise<MstSchoolMajor> {
    const repo = manager ? manager.getRepository(MstSchoolMajor) : this.mstSchoolMajorRepository;
    await repo.update(id, updateMstSchoolMajorDto);
    const updated = await repo.findOne({ where: { id } });
    if (!updated) {
      throw new Error('School-Major relation not found after update');
    }
    return updated;
  }

  /**
   * Soft delete school-major by ID
   */
  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(MstSchoolMajor) : this.mstSchoolMajorRepository;
    const result = await repo.softDelete(id);
    if (result.affected === 0) {
      throw new Error('School-Major relation not found for deletion');
    }
  }
}

