import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, IsNull } from 'typeorm';
import { MstLicense } from '../entities/mst_license.entity';
import { CreateMstLicenseDto } from '../dto/create-mst_license.dto';
import { UpdateMstLicenseDto } from '../dto/update-mst_license.dto';

@Injectable()
export class MstLicenseDao {
  constructor(
    @InjectRepository(MstLicense)
    private mstLicenseRepository: Repository<MstLicense>,
  ) {}

  /**
   * Create a new master license
   */
  async create(createMstLicenseDto: CreateMstLicenseDto, manager?: EntityManager): Promise<MstLicense> {
    const repo = manager ? manager.getRepository(MstLicense) : this.mstLicenseRepository;
    const entity = repo.create(createMstLicenseDto);
    return repo.save(entity);
  }

  /**
   * Find license by ID
   */
  async findById(id: string, manager?: EntityManager): Promise<MstLicense | null> {
    const repo = manager ? manager.getRepository(MstLicense) : this.mstLicenseRepository;
    return repo.findOne({ where: { id } });
  }

  /**
   * Find license by license_template_code (excluding soft-deleted)
   */
  async findByLicenseTemplateCode(licenseTemplateCode: string | null | undefined, manager?: EntityManager): Promise<MstLicense | null> {
    if (!licenseTemplateCode) {
      return null;
    }
    const repo = manager ? manager.getRepository(MstLicense) : this.mstLicenseRepository;
    return repo.findOne({ 
      where: { 
        license_template_code: licenseTemplateCode,
        deleted_at: IsNull()
      } 
    });
  }

  /**
   * Update license by ID
   */
  async update(id: string, updateMstLicenseDto: UpdateMstLicenseDto, manager?: EntityManager): Promise<MstLicense> {
    const repo = manager ? manager.getRepository(MstLicense) : this.mstLicenseRepository;
    await repo.update(id, updateMstLicenseDto);
    const updated = await repo.findOne({ where: { id } });
    if (!updated) {
      throw new Error('License not found after update');
    }
    return updated;
  }

  /**
   * Soft delete license by ID
   */
  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(MstLicense) : this.mstLicenseRepository;
    const result = await repo.softDelete(id);
    if (result.affected === 0) {
      throw new Error('License not found for deletion');
    }
  }
}