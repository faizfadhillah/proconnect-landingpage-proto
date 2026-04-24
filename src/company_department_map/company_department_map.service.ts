import { Injectable, BadRequestException, Inject, forwardRef, NotFoundException } from "@nestjs/common";
import { QueryRunner, Repository } from "typeorm";
import { CompanyDepartmentMapDao } from "./dao/company_department_map.dao";
import { MstDepartmentsService } from "../mst_departments/mst_departments.service";
import { MstDepartment, DepartmentFlag } from "../mst_departments/entities/mst_department.entity";
import { MstCompany } from "../mst_companies/entities/mst_company.entity";
import { UpsertDepartmentMappingsDto } from "./dto/upsert-department-mappings.dto";
import { MstDepartmentResponseDto } from "../mst_departments/dto/mst_department_response.dto";
import { UserRoleAssignmentService } from "../user_role_assignments/services/user_role_assignments.service";
import { LoggingService } from "src/logs/logs.service";
import { BasePagination } from "src/base.pagination";
import { MstCompanyHqBranchRelationService } from "src/mst_companies/service/company_hq_branch_relation.service";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class CompanyDepartmentMapService {
  constructor(
    private readonly companyDepartmentMapDao: CompanyDepartmentMapDao,
    @Inject(forwardRef(() => MstDepartmentsService))
    private readonly mstDepartmentsService: MstDepartmentsService,
    @Inject(forwardRef(() => MstCompanyHqBranchRelationService))
    private readonly mstCompanyHqBranchRelationService: MstCompanyHqBranchRelationService,
    @Inject(forwardRef(() => UserRoleAssignmentService))
    private readonly userRoleAssignmentService: UserRoleAssignmentService,
    private readonly logger: LoggingService,
    @InjectRepository(MstCompany)
    private readonly mstCompanyRepository: Repository<MstCompany>,
  ) { }

  /**
   * Get list of departments by company_id
   */
  public async getDepartmentsByCompanyId(companyId: string): Promise<MstDepartmentResponseDto[]> {
    this.logger.log(`Getting departments for company_id: ${companyId}`);

    // Get department IDs for the company
    const deptIds = await this.companyDepartmentMapDao.findDepartmentsByCompanyId(companyId);
    this.logger.log(`Found ${deptIds.length} department IDs for company_id: ${companyId}`);

    if (deptIds.length === 0) {
      this.logger.log(`No departments found for company_id: ${companyId}`);
      return [];
    }

    // Get department details
    const departments = await this.mstDepartmentsService.findByIds(deptIds);
    this.logger.log(`Retrieved ${departments.length} department details`);

    // Return only published departments, mapped to response DTO
    const publishedDepartments = departments
      .filter(dept => dept.status === 'PUBLISHED')
      .map(dept => this.mapToResponseDto(dept));
    this.logger.log(`Returning ${publishedDepartments.length} published departments`);

    return publishedDepartments;
  }

  /**
   * Get list of departments by company_hq_id
   */
  public async getDepartmentsByCompanyHqId(companyHqId: string): Promise<MstDepartmentResponseDto[]> {
    this.logger.log(`Getting departments for company HQ ID: ${companyHqId}`);

    // Get department IDs mapped to the company HQ
    const deptIds = await this.companyDepartmentMapDao.findDepartmentsByCompanyHqId(companyHqId);
    this.logger.log(`Found ${deptIds.length} department IDs for company HQ ID: ${companyHqId}`);

    if (deptIds.length === 0) {
      this.logger.log(`No departments found for company HQ ID: ${companyHqId}`);
      return [];
    }

    // Get department details
    const departments = await this.mstDepartmentsService.findByIds(deptIds);
    this.logger.log(`Retrieved ${departments.length} department details`);

    // Return only published departments, mapped to response DTO
    const publishedDepartments = departments
      .filter(dept => dept.status === 'PUBLISHED')
      .map(dept => this.mapToResponseDto(dept));
    this.logger.log(`Returning ${publishedDepartments.length} published departments`);

    return publishedDepartments;
  }

  /**
     * Get available departments for a company HQ ID
     * Includes departments mapped to the HQ and global departments
     */
  public async getAvailableDepartmentsByCompanyHqId(
    companyHqId: string,
    page?: number,
    limit?: number,
  ): Promise<BasePagination<MstDepartmentResponseDto>> {
    this.logger.log(`Getting available departments for company HQ ID: ${companyHqId}, page: ${page}, limit: ${limit}`);

    // Get department IDs mapped to the company HQ
    const mappedDeptIds = await this.companyDepartmentMapDao.findDepartmentsByCompanyHqId(companyHqId);
    this.logger.log(`Found ${mappedDeptIds.length} mapped department IDs`);

    // Get global departments
    const globalDepartments = await this.mstDepartmentsService.findByFlag(DepartmentFlag.GLOBAL);
    this.logger.log(`Found ${globalDepartments.length} global departments`);

    // Combine and deduplicate department IDs
    const allDeptIds = [...new Set([...mappedDeptIds, ...globalDepartments.map(dept => dept.id)])];
    this.logger.log(`Total unique department IDs: ${allDeptIds.length}`);

    // Get total count
    const total = allDeptIds.length;

    // Apply pagination to department IDs
    let paginatedDeptIds = allDeptIds;
    if (page && limit) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      paginatedDeptIds = allDeptIds.slice(startIndex, endIndex);
    }

    // Get department details for paginated IDs
    const departments = await this.mstDepartmentsService.findByIds(paginatedDeptIds);
    this.logger.log(`Retrieved ${departments.length} department details`);

    // Map to response DTO
    const items = departments.map(dept => this.mapToResponseDto(dept));

    // Calculate pagination metadata
    const totalPages = page && limit ? Math.ceil(total / limit) : 1;

    return {
      items,
      meta: {
        total,
        page: page || 1,
        limit: limit || total,
        totalPages,
      },
    };
  }

  /**
   * Helper method to map department entity to response DTO
   */
  private mapToResponseDto(department: MstDepartment): MstDepartmentResponseDto {
    return {
      id: department.id,
      dept_code: department.dept_code,
      dept_name: department.dept_name,
      created_at: department.created_at,
      updated_at: department.updated_at,
    };
  }

  /**
    * Validate that all departments are either GLOBAL or mapped to the company HQ
    */
  private async validateDepartmentMappings(deptIds: string[], companyHqId: string): Promise<void> {
    if (deptIds.length === 0) return;

    this.logger.log(`Validating department mappings for HQ ID: ${companyHqId}, deptIds: ${deptIds.join(', ')}`);

    // Get all departments to check their flags
    const departments = await this.mstDepartmentsService.findByIds(deptIds);

    // Get departments mapped to the company HQ
    const mappedDeptIds = await this.companyDepartmentMapDao.findDepartmentsByCompanyHqId(companyHqId);

    // Get mapping information for all department IDs (to check if PRIVATE depts are unmapped)
    const departmentMappings = await this.companyDepartmentMapDao.getDepartmentMappings(deptIds);

    // Check each department
    const invalidDeptIds: string[] = [];
    for (const deptId of deptIds) {
      const department = departments.find(dept => dept.id === deptId);

      // Department not found
      if (!department) {
        invalidDeptIds.push(deptId);
        continue;
      }

      // GLOBAL departments are always valid
      if (department.flag === DepartmentFlag.GLOBAL) {
        continue;
      }

      // For PRIVATE departments, check if they are mapped to HQ or unmapped
      if (department.flag === DepartmentFlag.PRIVATE) {
        const isMappedToHq = mappedDeptIds.includes(deptId);
        const isUnmapped = !departmentMappings.has(deptId) || departmentMappings.get(deptId)!.length === 0;

        // PRIVATE is valid if mapped to HQ OR completely unmapped
        if (isMappedToHq || isUnmapped) {
          continue;
        }

        // PRIVATE but mapped to different HQ is invalid
        invalidDeptIds.push(deptId);
      }
    }

    if (invalidDeptIds.length > 0) {
      this.logger.error(`Invalid departments found: ${invalidDeptIds.join(', ')}`);
      throw new BadRequestException(`Invalid departments: ${invalidDeptIds.join(', ')}. GLOBAL departments are always valid. PRIVATE departments must be either mapped to the company HQ or not mapped anywhere.`);
    }

    this.logger.log(`Department mappings validation passed`);
  }

  /**
   * Safely delete department mappings with validation
   * Checks user role assignments before deleting mappings
   */
  private async safeDeleteDepartmentMappings(
    companyId: string,
    deptIds: string[]
  ): Promise<void> {
    if (deptIds.length === 0) return;

    this.logger.log(`Safe deleting mappings for company: ${companyId}, depts: ${deptIds.join(', ')}`);

    const departments = await this.mstDepartmentsService.findByIds(deptIds);
    const deptMap = new Map(departments.map(dept => [dept.id, dept.dept_name]));

    const company = await this.mstCompanyRepository.findOneBy({ id: companyId });
    if (!company) {
      this.logger.error(`Company not found: ${companyId}`);
      throw new NotFoundException(`Company not found: ${companyId}`);
    }

    // Check if any of these department mappings are used in active user role assignments
    for (const deptId of deptIds) {
      if (await this.userRoleAssignmentService.isCompanyDeptAssigned(companyId, deptId)) {
        const deptName = deptMap.get(deptId) || deptId;
        this.logger.error(`Cannot delete mapping: department ${deptName} (${deptId}) from company ${company.branch} (${company.id}) has active assignments`);
        throw new BadRequestException(
          `Cannot remove department mapping for department ${deptName} from company ${company.branch} because it has active user role assignments. Please deactivate all assignments first.`
        );
      }
    }

    this.logger.log(`Validation passed, proceeding with deletion of ${deptIds.length} mappings`);
    await this.companyDepartmentMapDao.removeBulkByCompanyAndDepartments(companyId, deptIds);
    this.logger.log(`Successfully deleted ${deptIds.length} department mappings`);
  }

  /**
    * Unified function to handle department mappings sync
    * This will upsert mappings based on payload and delete mappings not in payload
    */
  public async upsertDepartmentMappings(dto: UpsertDepartmentMappingsDto): Promise<MstDepartmentResponseDto[]> {
    const { company_id, dept_ids } = dto;
    this.logger.log(`Upserting department mappings for company_id: ${company_id}, dept_ids: ${dept_ids.join(', ')}`);

    // Get HQ company from the provided company (could be branch or HQ)
    const hqCompany = await this.mstCompanyHqBranchRelationService.getHqCompanyFromBranch(company_id);
    const finalCompanyHqId = hqCompany?.id || company_id;
    this.logger.log(`Resolved HQ company ID: ${finalCompanyHqId}`);

    // Validate departments before proceeding
    await this.validateDepartmentMappings(dept_ids, finalCompanyHqId);
    this.logger.log(`Department mappings validated`);

    // Get current mappings for the company
    const currentMappings = await this.companyDepartmentMapDao.findByCompanyId(company_id);
    const currentDeptIds = currentMappings.map(mapping => mapping.dept_id);
    this.logger.log(`Current mappings: ${currentDeptIds.join(', ')}`);

    // Find departments to delete (exist in current but not in provided list)
    const deptIdsToDelete = currentDeptIds.filter(id => !dept_ids.includes(id));
    this.logger.log(`Departments to delete: ${deptIdsToDelete.join(', ')}`);

    // Find departments to add (exist in provided list but not in current)
    const deptIdsToAdd = dept_ids.filter(id => !currentDeptIds.includes(id));
    this.logger.log(`Departments to add: ${deptIdsToAdd.join(', ')}`);

    // Delete mappings that are no longer needed (safe delete with validation)
    if (deptIdsToDelete.length > 0) {
      await this.safeDeleteDepartmentMappings(company_id, deptIdsToDelete);
    }

    // Add new mappings (upsert)
    if (deptIdsToAdd.length > 0) {
      const newMappings = deptIdsToAdd.map(deptId => ({
        company_hq_id: finalCompanyHqId || null,
        company_id: company_id,
        dept_id: deptId,
      }));
      await this.companyDepartmentMapDao.createMany(newMappings);
      this.logger.log(`Added ${deptIdsToAdd.length} new mappings`);
    }

    // Return the updated list of departments for the company
    const result = await this.getDepartmentsByCompanyId(company_id);
    this.logger.log(`Upsert completed, returning ${result.length} departments`);

    return result;
  }

  /**
   * Get paginated departments by company ID with database-level pagination
   */
  public async getDepartmentsByCompanyIdPaginated(
    companyId: string,
    page?: number,
    limit?: number,
  ): Promise<BasePagination<MstDepartmentResponseDto>> {
    this.logger.log(`Getting paginated departments for company_id: ${companyId}, page: ${page}, limit: ${limit}`);

    // Get paginated departments directly from DAO with database-level pagination
    const { departments, total } = await this.companyDepartmentMapDao.findDepartmentsByCompanyIdPaginated(companyId, page, limit);
    this.logger.log(`Retrieved ${departments.length} department details out of ${total} total`);

    // Map to response DTO
    const items = departments.map(dept => this.mapToResponseDto(dept));
    this.logger.log(`Returning ${items.length} departments`);

    // Calculate pagination metadata
    const totalPages = page && limit ? Math.ceil(total / limit) : 1;

    return {
      items,
      meta: {
        total,
        page: page || 1,
        limit: limit || total,
        totalPages,
      },
    };
  }

  /**
    * Check if department is mapped to any company
    */
  public async isDepartmentMapped(deptId: string): Promise<boolean> {
    this.logger.log(`Checking if department ${deptId} is mapped to any company`);
    const isMapped = await this.companyDepartmentMapDao.isDepartmentMapped(deptId);
    this.logger.log(`Department ${deptId} mapped: ${isMapped}`);

    return isMapped;
  }

  /**
   * Get all company mappings for a specific department ID
   */
  public async getCompanyMappingsByDeptId(deptId: string): Promise<string[]> {
    this.logger.log(`Getting company mappings for department ID: ${deptId}`);
    const companyIds = await this.companyDepartmentMapDao.findCompaniesByDeptId(deptId);
    this.logger.log(`Found ${companyIds.length} company mappings for department ${deptId}`);
    return companyIds;
  }

  /**
   * Soft delete all department mappings for a specific company ID
   */
  public async softDeleteMappingsByCompanyId(companyId: string): Promise<number> {
    this.logger.log(`Soft deleting department mappings for company ID: ${companyId}`);
    const affectedRows = await this.companyDepartmentMapDao.softDeleteByCompanyId(companyId);
    this.logger.log(`Soft deleted ${affectedRows} department mappings for company ${companyId}`);
    return affectedRows;
  }

  /**
   * Insert a new department mapping for a company HQ
   * Pure insert without updates or deletes
   */
  public async insertDepartmentMapping(companyHqId: string, deptId: string, queryRunner?: QueryRunner): Promise<void> {
    this.logger.log(`Inserting department mapping for company HQ: ${companyHqId}, department: ${deptId}`);

    // Validate company exists
    const company = await queryRunner.manager.findOne(MstCompany, { where: { id: companyHqId } });
    if (!company) {
      this.logger.error(`Company HQ not found: ${companyHqId}`);
      throw new BadRequestException(`Company HQ with ID ${companyHqId} not found`);
    }

    // Validate department exists
    const department = await queryRunner.manager.findOne(MstDepartment, { where: { id: deptId } });
    if (!department) {
      this.logger.error(`Department not found: ${deptId}`);
      throw new BadRequestException(`Department with ID ${deptId} not found`);
    }

    // Insert the mapping
    const mapping = {
      company_hq_id: companyHqId,
      company_id: companyHqId,
      dept_id: deptId,
    };

    await this.companyDepartmentMapDao.create(mapping, queryRunner);
    this.logger.log(`Successfully inserted department mapping`);
  }

}