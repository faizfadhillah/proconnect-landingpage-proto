import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, IsNull } from 'typeorm';
import { MstEducationProfessionMapping } from '../entities/mst_education_profession_mapping.entity';
import { CreateEducationProfessionMappingDto } from '../dto/create-education-profession-mapping.dto';
import { UpdateEducationProfessionMappingDto } from '../dto/update-education-profession-mapping.dto';

@Injectable()
export class MstEducationProfessionMappingDao {
  constructor(
    @InjectRepository(MstEducationProfessionMapping)
    private repository: Repository<MstEducationProfessionMapping>,
  ) {}

  /**
   * Create a new education profession mapping
   */
  async create(
    dto: CreateEducationProfessionMappingDto,
    manager?: EntityManager
  ): Promise<MstEducationProfessionMapping> {
    const repo = manager ? manager.getRepository(MstEducationProfessionMapping) : this.repository;
    const entity = repo.create({
      school_id: dto.school_id,
      major_id: dto.major_id,
      degree: dto.degree,
      diploma_level: dto.diploma_level ?? null,
      profession_id: dto.profession_id,
    });
    return repo.save(entity);
  }

  /**
   * Find mapping by ID
   */
  async findById(
    id: string,
    manager?: EntityManager
  ): Promise<MstEducationProfessionMapping | null> {
    const repo = manager ? manager.getRepository(MstEducationProfessionMapping) : this.repository;
    return repo.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['school', 'major', 'profession', 'creator'],
    });
  }

  /**
   * Find all active (non-deleted) mappings for template prepopulate
   */
  async findAllActive(manager?: EntityManager): Promise<MstEducationProfessionMapping[]> {
    const repo = manager ? manager.getRepository(MstEducationProfessionMapping) : this.repository;
    return repo.find({
      where: { deleted_at: IsNull() },
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Find duplicate mapping
   */
  async findDuplicate(
    dto: CreateEducationProfessionMappingDto,
    manager?: EntityManager
  ): Promise<MstEducationProfessionMapping | null> {
    const repo = manager ? manager.getRepository(MstEducationProfessionMapping) : this.repository;
    const dl = dto.diploma_level ?? null;
    const qb = repo
      .createQueryBuilder("mapping")
      .where("mapping.school_id = :school_id", { school_id: dto.school_id })
      .andWhere("mapping.major_id = :major_id", { major_id: dto.major_id })
      .andWhere("mapping.degree = :degree", { degree: dto.degree })
      .andWhere("mapping.profession_id = :profession_id", { profession_id: dto.profession_id })
      .andWhere("mapping.deleted_at IS NULL");

    if (dl === null) {
      qb.andWhere("mapping.diploma_level IS NULL");
    } else {
      qb.andWhere("mapping.diploma_level = :dl", { dl });
    }

    const one = await qb.getOne();
    return one ?? null;
  }

  /**
   * Update mapping by ID
   */
  async update(
    id: string,
    dto: UpdateEducationProfessionMappingDto,
    manager?: EntityManager
  ): Promise<MstEducationProfessionMapping> {
    const repo = manager ? manager.getRepository(MstEducationProfessionMapping) : this.repository;
    
    const updateData: Partial<MstEducationProfessionMapping> = {};
    if (dto.school_id !== undefined) updateData.school_id = dto.school_id;
    if (dto.major_id !== undefined) updateData.major_id = dto.major_id;
    if (dto.degree !== undefined) updateData.degree = dto.degree;
    if (dto.diploma_level !== undefined) updateData.diploma_level = dto.diploma_level ?? null;
    if (dto.profession_id !== undefined) updateData.profession_id = dto.profession_id;
    
    await repo.update(id, updateData);
    const updated = await repo.findOne({
      where: { id },
      relations: ['school', 'major', 'profession', 'creator'],
    });
    
    if (!updated) {
      throw new Error('Mapping not found after update');
    }
    return updated;
  }

  /**
   * Soft delete mapping by ID
   */
  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(MstEducationProfessionMapping) : this.repository;
    const result = await repo.softDelete(id);
    if (result.affected === 0) {
      throw new Error('Mapping not found for deletion');
    }
  }

  /**
   * Find mapping by education and profession criteria
   * @param schoolId School ID
   * @param majorId Major ID
   * @param degree Education degree
   * @param diplomaLevel Diploma level
   * @param professionId Profession ID
   * @param manager Optional entity manager for transaction
   * @returns Mapping if found, null otherwise
   */
  async findByEducationAndProfession(
    schoolId: string,
    majorId: string,
    degree: string,
    diplomaLevel: string,
    professionId: string,
    manager?: EntityManager
  ): Promise<MstEducationProfessionMapping | null> {
    const repo = manager ? manager.getRepository(MstEducationProfessionMapping) : this.repository;
    return repo.findOne({
      where: {
        school_id: schoolId,
        major_id: majorId,
        degree: degree,
        diploma_level: diplomaLevel,
        profession_id: professionId,
        deleted_at: IsNull(),
      },
    });
  }

  /**
   * Check if any mapping exists for education and any of the profession IDs.
   * Matching: mapping.diploma_level IS NULL (wildcard) OR mapping.diploma_level = diplomaLevel.
   * @param diplomaLevel Education diploma level (null = match only mappings with diploma_level IS NULL)
   */
  async existsByEducationAndProfessions(
    schoolId: string,
    majorId: string,
    degree: string,
    diplomaLevel: string | null,
    professionIds: string[],
    manager?: EntityManager
  ): Promise<boolean> {
    if (!professionIds || professionIds.length === 0) {
      return false;
    }

    const repo = manager ? manager.getRepository(MstEducationProfessionMapping) : this.repository;
    const count = await repo
      .createQueryBuilder("mapping")
      .where("mapping.school_id = :schoolId", { schoolId })
      .andWhere("mapping.major_id = :majorId", { majorId })
      .andWhere("mapping.degree = :degree", { degree })
      .andWhere("(mapping.diploma_level IS NULL OR mapping.diploma_level = :diplomaLevel)", { diplomaLevel })
      .andWhere("mapping.profession_id IN (:...professionIds)", { professionIds })
      .andWhere("mapping.deleted_at IS NULL")
      .limit(1)
      .getCount();

    return count > 0;
  }

  /**
   * Find grouped education-profession mappings with pagination (DB-level grouping)
   * Groups mappings by school_id, major_id, degree, and diploma_level
   * Aggregates professions as JSON array
   * @param schoolIds Optional array of school IDs to filter by
   * @param schoolName Optional school name to filter by (ILIKE)
   * @param majorName Optional major name to filter by (ILIKE)
   * @param page Page number (1-based)
   * @param limit Items per page
   * @param manager Optional entity manager for transaction
   * @returns Object with grouped items and total count
   */
  async findAllGroupedWithPagination(
    schoolIds?: string[],
    schoolName?: string,
    majorName?: string,
    page: number = 1,
    limit: number = 10,
    manager?: EntityManager
  ): Promise<{ items: any[]; total: number }> {
    const repo = manager ? manager.getRepository(MstEducationProfessionMapping) : this.repository;
    const queryRunner = repo.manager.connection.createQueryRunner();
    
    try {
      // Build WHERE conditions and parameters
      const whereConditions: string[] = ['mapping.deleted_at IS NULL'];
      const queryParams: any[] = [];
      let paramIndex = 1;
      
      if (schoolIds && schoolIds.length > 0) {
        whereConditions.push(`mapping.school_id = ANY($${paramIndex})`);
        queryParams.push(schoolIds);
        paramIndex++;
      }
      
      if (schoolName) {
        whereConditions.push(`school.name ILIKE $${paramIndex}`);
        queryParams.push(`%${schoolName}%`);
        paramIndex++;
      }
      
      if (majorName) {
        whereConditions.push(`major.major_name ILIKE $${paramIndex}`);
        queryParams.push(`%${majorName}%`);
        paramIndex++;
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Count query for total
      const countQuery = `
        SELECT COUNT(DISTINCT (mapping.school_id, mapping.major_id, mapping.degree, mapping.diploma_level))
        FROM mst_education_profession_mappings mapping
        LEFT JOIN mst_schools school ON mapping.school_id = school.id
        LEFT JOIN mst_majors major ON mapping.major_id = major.id
        WHERE ${whereClause}
      `;
      
      const countResult = await queryRunner.query(countQuery, queryParams);
      const total = parseInt(countResult[0].count, 10);
      
      // Main grouped query with pagination
      const skip = (page - 1) * limit;
      queryParams.push(limit, skip);
      
      const groupedQuery = `
        SELECT 
          mapping.school_id,
          mapping.major_id,
          mapping.degree,
          mapping.diploma_level,
          json_build_object(
            'id', school.id,
            'name', school.name,
            'region_id', school.region_id,
            'address', school.address,
            'is_verified', school.is_verified,
            'created_at', school.created_at,
            'updated_at', school.updated_at,
            'deleted_at', school.deleted_at
          ) as school,
          json_build_object(
            'id', major.id,
            'major_name', major.major_name,
            'created_at', major.created_at,
            'updated_at', major.updated_at,
            'deleted_at', major.deleted_at
          ) as major,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', profession.id,
                'name', profession.name,
                'level', profession.level,
                'parent_id', profession.parent_id,
                'tags', profession.tags,
                'created_at', profession.created_at,
                'updated_at', profession.updated_at,
                'deleted_at', profession.deleted_at
              )
            ) FILTER (WHERE profession.id IS NOT NULL),
            '[]'::json
          ) as professions
        FROM mst_education_profession_mappings mapping
        LEFT JOIN mst_schools school ON mapping.school_id = school.id
        LEFT JOIN mst_majors major ON mapping.major_id = major.id
        LEFT JOIN mst_professions profession ON mapping.profession_id = profession.id AND profession.deleted_at IS NULL
        WHERE ${whereClause}
        GROUP BY mapping.school_id, mapping.major_id, mapping.degree, mapping.diploma_level,
                 school.id, school.name, school.region_id, school.address, school.is_verified,
                 school.created_at, school.updated_at, school.deleted_at,
                 major.id, major.major_name, major.created_at, major.updated_at, major.deleted_at
        ORDER BY school.name, major.major_name, mapping.degree, mapping.diploma_level
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const items = await queryRunner.query(groupedQuery, queryParams);
      
      return { items, total };
    } finally {
      await queryRunner.release();
    }
  }
}

