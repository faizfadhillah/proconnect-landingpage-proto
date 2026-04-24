import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { MstMajor } from '../entities/mst_major.entity';
import { CreateMstMajorDto } from '../dto/create-mst_major.dto';
import { UpdateMstMajorDto } from '../dto/update-mst_major.dto';

@Injectable()
export class MstMajorDao {
  constructor(
    @InjectRepository(MstMajor)
    private mstMajorRepository: Repository<MstMajor>,
  ) {}

  /**
   * Create a new master major
   */
  async create(createMstMajorDto: CreateMstMajorDto, manager?: EntityManager): Promise<MstMajor> {
    const repo = manager ? manager.getRepository(MstMajor) : this.mstMajorRepository;
    const entity = repo.create(createMstMajorDto);
    return repo.save(entity);
  }

  /**
   * Find major by ID
   */
  async findById(id: string, manager?: EntityManager): Promise<MstMajor | null> {
    const repo = manager ? manager.getRepository(MstMajor) : this.mstMajorRepository;
    return repo.findOne({ where: { id } });
  }

  /**
   * Find major by name (case-insensitive)
   */
  async findByName(majorName: string, manager?: EntityManager): Promise<MstMajor | null> {
    const repo = manager ? manager.getRepository(MstMajor) : this.mstMajorRepository;
    return repo
      .createQueryBuilder('major')
      .where('LOWER(major.major_name) = LOWER(:name)', { name: majorName })
      .andWhere('major.deleted_at IS NULL')
      .getOne();
  }

  /**
   * Update major by ID
   */
  async update(id: string, updateMstMajorDto: UpdateMstMajorDto, manager?: EntityManager): Promise<MstMajor> {
    const repo = manager ? manager.getRepository(MstMajor) : this.mstMajorRepository;
    await repo.update(id, updateMstMajorDto);
    const updated = await repo.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Major not found after update');
    }
    return updated;
  }

  /**
   * Soft delete major by ID
   * Updates major_name with -deleted-${timestamp} to allow name reuse
   */
  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(MstMajor) : this.mstMajorRepository;
    const major = await repo.findOne({ where: { id } });
    if (!major) {
      throw new Error('Major not found for deletion');
    }
    const timestamp = new Date().toISOString();
    await repo.update(id, {
      major_name: `${major.major_name}-deleted-${timestamp}`,
    });
    const result = await repo.softDelete(id);
    if (result.affected === 0) {
      throw new Error('Major not found for deletion');
    }
  }
}
