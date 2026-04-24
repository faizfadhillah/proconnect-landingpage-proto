import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, IsNull } from 'typeorm';
import { MstEducationLicenseMapping } from '../entities/mst_education_license_mapping.entity';
import { CreateEducationLicenseMappingDto } from '../dto/create-education-license-mapping.dto';
import { UpdateEducationLicenseMappingDto } from '../dto/update-education-license-mapping.dto';
import { UserEducation } from 'src/user_educations/entities/user_education.entity';

@Injectable()
export class MstEducationLicenseMappingDao {
  constructor(
    @InjectRepository(MstEducationLicenseMapping)
    private repository: Repository<MstEducationLicenseMapping>,
  ) {}

  /**
   * Create a new education license mapping
   */
  async create(
    dto: CreateEducationLicenseMappingDto,
    manager?: EntityManager
  ): Promise<MstEducationLicenseMapping> {
    const repo = manager ? manager.getRepository(MstEducationLicenseMapping) : this.repository;
    const entity = repo.create({
      school_id: dto.school_id,
      major_id: dto.major_id,
      degree: dto.degree,
      diploma_level: dto.diploma_level ?? null,
      license_id: dto.license_id,
    });
    return repo.save(entity);
  }

  /**
   * Find mapping by ID
   */
  async findById(
    id: string,
    manager?: EntityManager
  ): Promise<MstEducationLicenseMapping | null> {
    const repo = manager ? manager.getRepository(MstEducationLicenseMapping) : this.repository;
    return repo.findOne({
      where: { id, deleted_at: IsNull() },
      relations: ['school', 'major', 'license', 'creator'],
    });
  }

  /**
   * Find all active (non-deleted) mappings for template prepopulate
   */
  async findAllActive(manager?: EntityManager): Promise<MstEducationLicenseMapping[]> {
    const repo = manager ? manager.getRepository(MstEducationLicenseMapping) : this.repository;
    return repo.find({
      where: { deleted_at: IsNull() },
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Find duplicate mapping
   */
  async findDuplicate(
    dto: CreateEducationLicenseMappingDto,
    manager?: EntityManager
  ): Promise<MstEducationLicenseMapping | null> {
    const repo = manager ? manager.getRepository(MstEducationLicenseMapping) : this.repository;
    const dl = dto.diploma_level ?? null;
    const qb = repo
      .createQueryBuilder("mapping")
      .where("mapping.school_id = :school_id", { school_id: dto.school_id })
      .andWhere("mapping.major_id = :major_id", { major_id: dto.major_id })
      .andWhere("mapping.degree = :degree", { degree: dto.degree })
      .andWhere("mapping.license_id = :license_id", { license_id: dto.license_id })
      .andWhere("mapping.deleted_at IS NULL");

    // Handle nullable diploma_level without untyped parameter in `IS NULL` condition
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
    dto: UpdateEducationLicenseMappingDto,
    manager?: EntityManager
  ): Promise<MstEducationLicenseMapping> {
    const repo = manager ? manager.getRepository(MstEducationLicenseMapping) : this.repository;
    
    const updateData: Partial<MstEducationLicenseMapping> = {};
    if (dto.school_id !== undefined) updateData.school_id = dto.school_id;
    if (dto.major_id !== undefined) updateData.major_id = dto.major_id;
    if (dto.degree !== undefined) updateData.degree = dto.degree;
    if (dto.diploma_level !== undefined) updateData.diploma_level = dto.diploma_level ?? null;
    if (dto.license_id !== undefined) updateData.license_id = dto.license_id;
    
    await repo.update(id, updateData);
    const updated = await repo.findOne({
      where: { id },
      relations: ['school', 'major', 'license', 'creator'],
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
    const repo = manager ? manager.getRepository(MstEducationLicenseMapping) : this.repository;
    const result = await repo.softDelete(id);
    if (result.affected === 0) {
      throw new Error('Mapping not found for deletion');
    }
  }

  /**
   * Find education-license mappings by education data
   * Used by: Education Verification Flow
   */
  async findByEducation(
    education: UserEducation,
    manager?: EntityManager
  ): Promise<MstEducationLicenseMapping[]> {
    const repo = manager ? manager.getRepository(MstEducationLicenseMapping) : this.repository;
    
    const diplomaLevel = education.diploma_level ?? null;
    const query = repo
      .createQueryBuilder('mapping')
      .leftJoinAndSelect('mapping.license', 'license')
      .where('mapping.school_id = :school_id', { school_id: education.school_id })
      .andWhere('mapping.major_id = :major_id', { major_id: education.major_id })
      .andWhere('mapping.degree = :degree', { degree: education.education_degree })
      .andWhere('(mapping.diploma_level IS NULL OR mapping.diploma_level = :diploma_level)', { diploma_level: diplomaLevel })
      .andWhere('mapping.deleted_at IS NULL');

    return await query.getMany();
  }

  /**
   * Find education-license mapping by education data and specific license ID
   * Used for retroactive processing to find specific mapping
   */
  async findByEducationAndLicenseId(
    education: UserEducation,
    licenseId: string,
    manager?: EntityManager
  ): Promise<MstEducationLicenseMapping | null> {
    const repo = manager ? manager.getRepository(MstEducationLicenseMapping) : this.repository;
    
    const diplomaLevel = education.diploma_level ?? null;
    const query = repo
      .createQueryBuilder('mapping')
      .where('mapping.school_id = :school_id', { school_id: education.school_id })
      .andWhere('mapping.major_id = :major_id', { major_id: education.major_id })
      .andWhere('mapping.degree = :degree', { degree: education.education_degree })
      .andWhere('(mapping.diploma_level IS NULL OR mapping.diploma_level = :diploma_level)', { diploma_level: diplomaLevel })
      .andWhere('mapping.license_id = :license_id', { license_id: licenseId })
      .andWhere('mapping.deleted_at IS NULL');

    return await query.getOne();
  }

  /**
   * Find education-license mappings by multiple education criteria
   * Matches any of the provided criteria combinations using OR conditions
   * Used for bulk fetching licenses for pending students
   * @param criteria Array of education criteria objects
   * @param manager Optional entity manager for transaction
   * @returns Mappings with license relation loaded
   */
  async findByEducationCriteria(
    criteria: Array<{
      school_id: string;
      major_id: string | null;
      degree: string;
      diploma_level: string | null;
    }>,
    manager?: EntityManager
  ): Promise<MstEducationLicenseMapping[]> {
    const repo = manager ? manager.getRepository(MstEducationLicenseMapping) : this.repository;
    
    if (criteria.length === 0) {
      return [];
    }

    const query = repo
      .createQueryBuilder('mapping')
      .leftJoinAndSelect('mapping.license', 'license')
      .where('mapping.deleted_at IS NULL');

    // Build OR conditions for each criteria
    const orConditions = criteria.map((criterion, index) => {
      const conditions: string[] = [];
      const params: Record<string, any> = {};

      conditions.push(`mapping.school_id = :school_id_${index}`);
      params[`school_id_${index}`] = criterion.school_id;

      // Handle nullable major_id
      if (criterion.major_id === null || criterion.major_id === undefined) {
        conditions.push(`mapping.major_id IS NULL`);
      } else {
        conditions.push(`mapping.major_id = :major_id_${index}`);
        params[`major_id_${index}`] = criterion.major_id;
      }

      conditions.push(`mapping.degree = :degree_${index}`);
      params[`degree_${index}`] = criterion.degree;

      // Handle nullable diploma_level
      if (criterion.diploma_level === null || criterion.diploma_level === undefined) {
        conditions.push(`mapping.diploma_level IS NULL`);
      } else {
        conditions.push(`mapping.diploma_level = :diploma_level_${index}`);
        params[`diploma_level_${index}`] = criterion.diploma_level;
      }

      // Set parameters
      Object.keys(params).forEach(key => {
        query.setParameter(key, params[key]);
      });

      return `(${conditions.join(' AND ')})`;
    });

    // Add OR conditions
    if (orConditions.length > 0) {
      query.andWhere(`(${orConditions.join(' OR ')})`);
    }

    return await query.getMany();
  }

  /**
   * Find all mappings with relations for grouping
   * @param schoolIds Optional array of school IDs to filter by
   * @param schoolName Optional school name to filter by (ILIKE)
   * @param majorName Optional major name to filter by (ILIKE)
   * @param manager Optional entity manager for transaction
   * @returns All mappings with school, major, and license relations loaded
   */
  async findAllForGrouping(
    schoolIds?: string[],
    schoolName?: string,
    majorName?: string,
    manager?: EntityManager
  ): Promise<MstEducationLicenseMapping[]> {
    const repo = manager ? manager.getRepository(MstEducationLicenseMapping) : this.repository;
    
    const query = repo
      .createQueryBuilder('mapping')
      .leftJoinAndSelect('mapping.school', 'school')
      .leftJoinAndSelect('mapping.major', 'major')
      .leftJoinAndSelect('mapping.license', 'license')
      .where('mapping.deleted_at IS NULL');

    if (schoolIds && schoolIds.length > 0) {
      query.andWhere('mapping.school_id IN (:...schoolIds)', { schoolIds });
    }

    if (schoolName) {
      query.andWhere('school.name ILIKE :schoolName', { 
        schoolName: `%${schoolName}%` 
      });
    }

    if (majorName) {
      query.andWhere('major.major_name ILIKE :majorName', { 
        majorName: `%${majorName}%` 
      });
    }

    return await query.getMany();
  }

  /**
   * Find grouped education-license mappings with pagination (DB-level grouping)
   * Groups mappings by school_id, major_id, degree, and diploma_level
   * Aggregates licenses as JSON array
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
    majorId?: string,
    degree?: string,
    diplomaLevel?: string | null,
    page: number = 1,
    limit: number = 10,
    manager?: EntityManager
  ): Promise<{ items: any[]; total: number }> {
    const repo = manager ? manager.getRepository(MstEducationLicenseMapping) : this.repository;
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

      if (majorId) {
        whereConditions.push(`mapping.major_id = $${paramIndex}`);
        queryParams.push(majorId);
        paramIndex++;
      }

      if (degree) {
        whereConditions.push(`mapping.degree = $${paramIndex}`);
        queryParams.push(degree);
        paramIndex++;
      }

      if (diplomaLevel === null) {
        whereConditions.push(`mapping.diploma_level IS NULL`);
      } else if (diplomaLevel !== undefined && diplomaLevel !== null) {
        whereConditions.push(`mapping.diploma_level = $${paramIndex}`);
        queryParams.push(diplomaLevel);
        paramIndex++;
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // Count query for total
      const countQuery = `
        SELECT COUNT(DISTINCT (mapping.school_id, mapping.major_id, mapping.degree, mapping.diploma_level))
        FROM mst_education_license_mappings mapping
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
              )
            ) FILTER (WHERE license.id IS NOT NULL),
            '[]'::json
          ) as licenses
        FROM mst_education_license_mappings mapping
        LEFT JOIN mst_schools school ON mapping.school_id = school.id
        LEFT JOIN mst_majors major ON mapping.major_id = major.id
        LEFT JOIN mst_licenses license ON mapping.license_id = license.id AND license.deleted_at IS NULL
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

