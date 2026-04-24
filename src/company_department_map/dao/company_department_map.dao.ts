import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In, QueryRunner } from "typeorm";
import { CompanyDepartmentMap } from "../entities/company_department_map.entity";
import { MstDepartment } from "../../mst_departments/entities/mst_department.entity";

@Injectable()
export class CompanyDepartmentMapDao {
  constructor(
    @InjectRepository(CompanyDepartmentMap)
    private readonly companyDepartmentMapRepository: Repository<CompanyDepartmentMap>,
    @InjectRepository(MstDepartment)
    private readonly mstDepartmentRepository: Repository<MstDepartment>,
  ) { }

  async create(mapping: Partial<CompanyDepartmentMap>, queryRunner?: QueryRunner): Promise<CompanyDepartmentMap> {
    const newMapping = this.companyDepartmentMapRepository.create(mapping);
    if (queryRunner) {
      return await queryRunner.manager.save(CompanyDepartmentMap, newMapping);
    }
    return await this.companyDepartmentMapRepository.save(newMapping);
  }

  async createMany(mappings: Partial<CompanyDepartmentMap>[]): Promise<CompanyDepartmentMap[]> {
    const newMappings = this.companyDepartmentMapRepository.create(mappings);
    return await this.companyDepartmentMapRepository.save(newMappings);
  }

  async findByCompanyId(companyId: string): Promise<CompanyDepartmentMap[]> {
    return await this.companyDepartmentMapRepository.find({
      where: {
        company_id: companyId,
        deleted_at: null
      },
      order: { created_at: "DESC" },
    });
  }

  async findDepartmentsByCompanyId(companyId: string): Promise<string[]> {
    const mappings = await this.companyDepartmentMapRepository.find({
      where: { company_id: companyId, deleted_at: null },
      select: ["dept_id"],
    });
    return mappings.map(mapping => mapping.dept_id);
  }

  async findDepartmentsByCompanyHqId(companyHqId: string): Promise<string[]> {
    const mappings = await this.companyDepartmentMapRepository.find({
      where: { company_hq_id: companyHqId, deleted_at: null },
      select: ["dept_id"],
    });
    return mappings.map(mapping => mapping.dept_id);
  }

  /**
   * Get mapping information for specific department IDs
   * Returns Map<deptId, companyHqIds[]> to check if departments are mapped and to which HQ
   */
  async getDepartmentMappings(deptIds: string[]): Promise<Map<string, string[]>> {
    if (deptIds.length === 0) return new Map();

    const mappings = await this.companyDepartmentMapRepository.find({
      where: { 
        dept_id: In(deptIds), 
        deleted_at: null 
      },
      select: ["dept_id", "company_hq_id"],
    });

    // Group by dept_id
    const mappingMap = new Map<string, string[]>();
    
    for (const mapping of mappings) {
      const deptId = mapping.dept_id;
      const companyHqId = mapping.company_hq_id;
      
      if (!mappingMap.has(deptId)) {
        mappingMap.set(deptId, []);
      }
      
      // Only add non-null company HQ IDs
      if (companyHqId) {
        mappingMap.get(deptId)!.push(companyHqId);
      }
    }

    return mappingMap;
  }

  async removeBulkByCompanyAndDepartments(companyId: string, deptIds: string[]): Promise<number> {
    const result = await this.companyDepartmentMapRepository.delete({
      company_id: companyId,
      dept_id: In(deptIds),
    });
    return result.affected || 0;
  }

  /**
   * Check if department is mapped to any company
   */
  async isDepartmentMapped(deptId: string): Promise<boolean> {
    const companyDeptMap = await this.companyDepartmentMapRepository.findOne({
      where: {
        dept_id: deptId,
      }
    });
    return companyDeptMap !== null;
  }

  /**
   * Get all company mappings for a specific department ID
   */
  async findCompaniesByDeptId(deptId: string): Promise<string[]> {
    const mappings = await this.companyDepartmentMapRepository.find({
      where: { 
        dept_id: deptId, 
        deleted_at: null 
      },
      select: ["company_id"],
    });
    return mappings.map(mapping => mapping.company_id);
  }

  /**
   * Get paginated departments for a company with database-level pagination using JOIN
   */
  async findDepartmentsByCompanyIdPaginated(
    companyId: string,
    page?: number,
    limit?: number,
  ): Promise<{ departments: MstDepartment[]; total: number }> {
    // Create query builder with JOIN between company_department_map and mst_departments
    let query = this.mstDepartmentRepository.createQueryBuilder('dept')
      .innerJoin('company_department_map', 'mapping',
        'mapping.dept_id = dept.id AND mapping.company_id = :companyId AND mapping.deleted_at IS NULL',
        { companyId }
      )
      .where('dept.status = :status', { status: 'PUBLISHED' })
      .orderBy('dept.created_at', 'DESC');

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    if (page && limit) {
      query = query.skip((page - 1) * limit).take(limit);
    }

    const departments = await query.getMany();

    return { departments, total };
  }

  /**
   * Soft delete all mappings for a specific company ID
   */
  async softDeleteByCompanyId(companyId: string): Promise<number> {
    const result = await this.companyDepartmentMapRepository.softDelete(
      { company_id: companyId, deleted_at: null },
    );
    return result.affected || 0;
  }

  /**
   * Get all mappings by company HQ ID (including all child companies)
   */
  async findByCompanyHqId(companyHqId: string): Promise<CompanyDepartmentMap[]> {
    return await this.companyDepartmentMapRepository.find({
      where: {
        company_hq_id: companyHqId,
        deleted_at: null
      },
      select: ['company_hq_id', 'company_id', 'dept_id'],
    });
  }
}
