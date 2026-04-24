import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager, IsNull } from "typeorm";
import { MstInformalCertificateMapping } from "../entities/mst_informal_certificate_mapping.entity";
import { CreateInformalCertificateMappingDto } from "../dto/create-informal-certificate-mapping.dto";
import { UpdateInformalCertificateMappingDto } from "../dto/update-informal-certificate-mapping.dto";
import { InformalCertificateMappingStatus } from "../enums/informal-certificate-mapping-status.enum";

@Injectable()
export class MstInformalCertificateMappingDao {
  constructor(
    @InjectRepository(MstInformalCertificateMapping)
    private repository: Repository<MstInformalCertificateMapping>,
  ) {}

  /**
   * Create a new informal certificate mapping
   */
  async create(
    dto: CreateInformalCertificateMappingDto,
    manager?: EntityManager
  ): Promise<MstInformalCertificateMapping> {
    const repo = manager ? manager.getRepository(MstInformalCertificateMapping) : this.repository;
    const entity = repo.create({
      email: dto.email || null,
      phone: dto.phone || null,
      name: dto.name,
      photo_url: dto.photo_url || null,
      license_id: dto.license_id,
      status: InformalCertificateMappingStatus.UNPROCESSED,
    });
    return repo.save(entity);
  }

  /**
   * Find mapping by ID
   */
  async findById(
    id: string,
    manager?: EntityManager
  ): Promise<MstInformalCertificateMapping | null> {
    const repo = manager ? manager.getRepository(MstInformalCertificateMapping) : this.repository;
    return repo.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ["license"],
    });
  }

  /**
   * Update mapping by ID
   */
  async update(
    id: string,
    dto: UpdateInformalCertificateMappingDto,
    manager?: EntityManager
  ): Promise<MstInformalCertificateMapping> {
    const repo = manager ? manager.getRepository(MstInformalCertificateMapping) : this.repository;
    
    const updateData: Partial<MstInformalCertificateMapping> = {};
    if (dto.email !== undefined) updateData.email = dto.email || null;
    if (dto.phone !== undefined) updateData.phone = dto.phone || null;
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.photo_url !== undefined) updateData.photo_url = dto.photo_url || null;
    if (dto.license_id !== undefined) updateData.license_id = dto.license_id;
    
    await repo.update(id, updateData);
    const updated = await repo.findOne({
      where: { id },
      relations: ["license"],
    });
    
    if (!updated) {
      throw new Error("Mapping not found after update");
    }
    return updated;
  }

  /**
   * Soft delete mapping by ID
   */
  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(MstInformalCertificateMapping) : this.repository;
    const result = await repo.softDelete(id);
    if (result.affected === 0) {
      throw new Error("Mapping not found for deletion");
    }
  }

  /**
   * Find duplicate mapping
   * Unique constraint: (email + license_id) OR (phone + license_id)
   * Check if there's an existing mapping with same license_id and matching email or phone
   */
  async findDuplicate(
    dto: CreateInformalCertificateMappingDto,
    excludeId?: string,
    manager?: EntityManager
  ): Promise<MstInformalCertificateMapping | null> {
    const repo = manager ? manager.getRepository(MstInformalCertificateMapping) : this.repository;
    const query = repo
      .createQueryBuilder("mapping")
      .where("mapping.license_id = :license_id", { license_id: dto.license_id })
      .andWhere("mapping.deleted_at IS NULL");

    if (excludeId) {
      query.andWhere("mapping.id != :excludeId", { excludeId });
    }

    // Build conditions: match email OR phone
    const conditions: string[] = [];
    const params: any = { license_id: dto.license_id };

    if (dto.email) {
      conditions.push("mapping.email = :email");
      params.email = dto.email;
    }

    if (dto.phone) {
      conditions.push("mapping.phone = :phone");
      params.phone = dto.phone;
    }

    if (conditions.length > 0) {
      query.andWhere(`(${conditions.join(" OR ")})`, params);
    } else {
      // If neither email nor phone provided, return null (shouldn't happen due to validation)
      return null;
    }

    return await query.getOne();
  }

  /**
   * Find unprocessed mappings by email or phone (for Phase 5)
   */
  async findUnprocessedByEmailOrPhone(
    email?: string,
    phone?: string,
    manager?: EntityManager
  ): Promise<MstInformalCertificateMapping[]> {
    const repo = manager ? manager.getRepository(MstInformalCertificateMapping) : this.repository;
    const query = repo
      .createQueryBuilder("mapping")
      .where("mapping.status = :status", {
        status: InformalCertificateMappingStatus.UNPROCESSED,
      })
      .andWhere("mapping.deleted_at IS NULL");

    if (email && phone) {
      query.andWhere("(mapping.email = :email OR mapping.phone = :phone)", {
        email,
        phone,
      });
    } else if (email) {
      query.andWhere("mapping.email = :email", { email });
    } else if (phone) {
      query.andWhere("mapping.phone = :phone", { phone });
    }

    return await query.getMany();
  }
}

