import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, IsNull } from 'typeorm';
import { MstSchool } from '../entities/mst_school.entity';

@Injectable()
export class MstSchoolDao {
  constructor(
    @InjectRepository(MstSchool)
    private repository: Repository<MstSchool>,
  ) {}

  /**
   * Find school by ID
   */
  async findById(
    id: string,
    manager?: EntityManager
  ): Promise<MstSchool | null> {
    const repo = manager ? manager.getRepository(MstSchool) : this.repository;
    return repo.findOne({
      where: { id, deleted_at: IsNull() },
    });
  }
}

