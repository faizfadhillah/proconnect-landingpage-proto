import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager, IsNull, In } from "typeorm";
import { MstLicenseSkillMapping } from "../entities/mst_license_skill_mapping.entity";
import { CreateLicenseSkillMappingDto } from "../dto/create-license-skill-mapping.dto";
import { UpdateLicenseSkillMappingDto } from "../dto/update-license-skill-mapping.dto";

@Injectable()
export class MstLicenseSkillMappingDao {
  constructor(
    @InjectRepository(MstLicenseSkillMapping)
    private repository: Repository<MstLicenseSkillMapping>,
  ) {}

  /**
   * Create a new license skill mapping
   */
  async create(
    dto: CreateLicenseSkillMappingDto,
    manager?: EntityManager
  ): Promise<MstLicenseSkillMapping> {
    const repo = manager ? manager.getRepository(MstLicenseSkillMapping) : this.repository;
    const entity = repo.create({
      license_id: dto.license_id,
      skill_id: dto.skill_id,
    });
    return repo.save(entity);
  }

  /**
   * Find mapping by ID
   */
  async findById(
    id: string,
    manager?: EntityManager
  ): Promise<MstLicenseSkillMapping | null> {
    const repo = manager ? manager.getRepository(MstLicenseSkillMapping) : this.repository;
    return repo.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ["license", "skill"],
    });
  }

  /**
   * Find all active (non-deleted) mappings for template prepopulate
   */
  async findAllActive(manager?: EntityManager): Promise<MstLicenseSkillMapping[]> {
    const repo = manager ? manager.getRepository(MstLicenseSkillMapping) : this.repository;
    return repo.find({
      where: { deleted_at: IsNull() },
      order: { created_at: "ASC" },
    });
  }

  /**
   * Find duplicate mapping
   */
  async findDuplicate(
    dto: CreateLicenseSkillMappingDto,
    manager?: EntityManager
  ): Promise<MstLicenseSkillMapping | null> {
    const repo = manager ? manager.getRepository(MstLicenseSkillMapping) : this.repository;
    return repo.findOne({
      where: {
        license_id: dto.license_id,
        skill_id: dto.skill_id,
        deleted_at: IsNull(),
      },
    });
  }

  /**
   * Update mapping by ID
   */
  async update(
    id: string,
    dto: UpdateLicenseSkillMappingDto,
    manager?: EntityManager
  ): Promise<MstLicenseSkillMapping> {
    const repo = manager ? manager.getRepository(MstLicenseSkillMapping) : this.repository;
    
    const updateData: Partial<MstLicenseSkillMapping> = {};
    if (dto.license_id !== undefined) updateData.license_id = dto.license_id;
    if (dto.skill_id !== undefined) updateData.skill_id = dto.skill_id;
    
    await repo.update(id, updateData);
    const updated = await repo.findOne({
      where: { id },
      relations: ["license", "skill"],
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
    const repo = manager ? manager.getRepository(MstLicenseSkillMapping) : this.repository;
    const result = await repo.softDelete(id);
    if (result.affected === 0) {
      throw new Error("Mapping not found for deletion");
    }
  }

  /**
   * Find mappings by license ID
   */
  async findByLicenseId(
    licenseId: string,
    manager?: EntityManager
  ): Promise<MstLicenseSkillMapping[]> {
    const repo = manager ? manager.getRepository(MstLicenseSkillMapping) : this.repository;
    return repo.find({
      where: { license_id: licenseId, deleted_at: IsNull() },
      relations: ["skill"],
    });
  }

  /**
   * Find mappings by multiple license IDs in one query
   * Used for bulk fetching license-skill mappings
   * @param licenseIds Array of license IDs
   * @param manager Optional entity manager for transaction
   * @returns Mappings with skill relation loaded
   */
  async findByLicenseIds(
    licenseIds: string[],
    manager?: EntityManager
  ): Promise<MstLicenseSkillMapping[]> {
    const repo = manager ? manager.getRepository(MstLicenseSkillMapping) : this.repository;
    
    if (licenseIds.length === 0) {
      return [];
    }

    return repo.find({
      where: {
        license_id: In(licenseIds),
        deleted_at: IsNull(),
      },
      relations: ["skill"],
    });
  }

  /**
   * Find mapping by license ID and skill ID
   * Used for retroactive processing to find specific mapping
   */
  async findByLicenseIdAndSkillId(
    licenseId: string,
    skillId: string,
    manager?: EntityManager
  ): Promise<MstLicenseSkillMapping | null> {
    const repo = manager ? manager.getRepository(MstLicenseSkillMapping) : this.repository;
    return repo.findOne({
      where: {
        license_id: licenseId,
        skill_id: skillId,
        deleted_at: IsNull(),
      },
      relations: ["skill"],
    });
  }

  /**
   * Find all mappings with relations for grouping
   * @param licenseName Optional license name to filter by (ILIKE)
   * @param skillName Optional skill name to filter by (ILIKE)
   * @param manager Optional entity manager for transaction
   * @returns All mappings with license and skill relations loaded
   */
  async findAllForGrouping(
    licenseName?: string,
    skillName?: string,
    manager?: EntityManager
  ): Promise<MstLicenseSkillMapping[]> {
    const repo = manager ? manager.getRepository(MstLicenseSkillMapping) : this.repository;
    
    const query = repo
      .createQueryBuilder('mapping')
      .leftJoinAndSelect('mapping.license', 'license')
      .leftJoinAndSelect('mapping.skill', 'skill')
      .where('mapping.deleted_at IS NULL');

    if (licenseName) {
      query.andWhere('license.license_name ILIKE :licenseName', { 
        licenseName: `%${licenseName}%` 
      });
    }

    if (skillName) {
      query.andWhere('skill.name ILIKE :skillName', { 
        skillName: `%${skillName}%` 
      });
    }

    return await query.getMany();
  }

  /**
   * Find grouped license-skill mappings with pagination (DB-level grouping)
   * Groups mappings by license_id
   * Aggregates skills as JSON array
   * @param licenseName Optional license name to filter by (ILIKE)
   * @param skillName Optional skill name to filter by (ILIKE)
   * @param page Page number (1-based)
   * @param limit Items per page
   * @param manager Optional entity manager for transaction
   * @returns Object with grouped items and total count
   */
  async findAllGroupedWithPagination(
    licenseName?: string,
    skillName?: string,
    page: number = 1,
    limit: number = 10,
    manager?: EntityManager
  ): Promise<{ items: any[]; total: number }> {
    const repo = manager ? manager.getRepository(MstLicenseSkillMapping) : this.repository;
    const queryRunner = repo.manager.connection.createQueryRunner();
    
    try {
      // Build WHERE conditions and parameters
      const whereConditions: string[] = ['mapping.deleted_at IS NULL'];
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      if (licenseName) {
        whereConditions.push(`license.license_name ILIKE $${paramIndex}`);
        queryParams.push(`%${licenseName}%`);
        paramIndex++;
      }
      
      if (skillName) {
        whereConditions.push(`skill.name ILIKE $${paramIndex}`);
        queryParams.push(`%${skillName}%`);
        paramIndex++;
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Count query for total
      const countQuery = `
        SELECT COUNT(DISTINCT mapping.license_id)
        FROM mst_license_skill_mappings mapping
        LEFT JOIN mst_licenses license ON mapping.license_id = license.id
        LEFT JOIN mst_skills skill ON mapping.skill_id = skill.id
        WHERE ${whereClause}
      `;
      
      const countResult = await queryRunner.query(countQuery, queryParams);
      const total = parseInt(countResult[0].count, 10);
      
      // Main grouped query with pagination
      const skip = (page - 1) * limit;
      queryParams.push(limit, skip);
      
      const groupedQuery = `
        SELECT 
          mapping.license_id,
          json_build_object(
            'id', license.id,
            'license_template_code', license.license_template_code,
            'license_name', license.license_name,
            'issuing_organization', license.issuing_organization,
            'issue_date', license.issue_date,
            'test_location', license.test_location,
            'assessor', license.assessor,
            'certificate_level', license.certificate_level,
            'standard_name', license.standard_name,
            'created_at', license.created_at,
            'updated_at', license.updated_at,
            'deleted_at', license.deleted_at
          ) as license,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', skill.id,
                'name', skill.name,
                'created_at', skill.created_at,
                'updated_at', skill.updated_at,
                'deleted_at', skill.deleted_at
              )
            ) FILTER (WHERE skill.id IS NOT NULL),
            '[]'::json
          ) as skills
        FROM mst_license_skill_mappings mapping
        LEFT JOIN mst_licenses license ON mapping.license_id = license.id AND license.deleted_at IS NULL
        LEFT JOIN mst_skills skill ON mapping.skill_id = skill.id AND skill.deleted_at IS NULL
        WHERE ${whereClause}
        GROUP BY mapping.license_id,
                 license.id, license.license_template_code, license.license_name, license.issuing_organization,
                 license.issue_date, license.test_location, license.assessor, license.certificate_level,
                 license.standard_name,
                 license.created_at, license.updated_at, license.deleted_at
        ORDER BY license.license_name
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const items = await queryRunner.query(groupedQuery, queryParams);
      
      return { items, total };
    } finally {
      await queryRunner.release();
    }
  }
}

