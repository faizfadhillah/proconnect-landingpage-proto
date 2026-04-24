import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MstCompany } from "../entities/mst_company.entity";
import { UserRoleAssignmentService } from "src/user_role_assignments/services/user_role_assignments.service";
import { LoggingService } from "src/logs/logs.service";
import { CompanyDepartmentMapService } from "src/company_department_map/company_department_map.service";
import { FieldsService } from "src/zfields/fields.service";
import { MstCompaniesUtils } from "../mst_companies.utils";
import { MstCompanyHqBranchRelationService } from "./company_hq_branch_relation.service";
import { UpdateMstCompanyDto } from "../dto/update-mst_company.dto";

@Injectable()
export class HqBranchMirrorService {
  constructor(
    @InjectRepository(MstCompany)
    private mstCompanyRepository: Repository<MstCompany>,
    @Inject(forwardRef(() => UserRoleAssignmentService))
    private readonly userRoleAssignmentService: UserRoleAssignmentService,
    private readonly logger: LoggingService,
    @Inject(forwardRef(() => CompanyDepartmentMapService))
    private readonly companyDepartmentMapService: CompanyDepartmentMapService,
    private readonly fieldsService: FieldsService,
    private readonly utils: MstCompaniesUtils,
    private readonly companyHqBranchRelationService: MstCompanyHqBranchRelationService,
  ) { }

  /**
   * Validate HQ update operations
   * @param companyId The ID of the company being updated
   * @param updateDto The update data
   * @returns boolean indicating if validation passed
   */
  async validateHqUpdate(companyId: string, updateDto: UpdateMstCompanyDto): Promise<boolean> {
    // Check if this is an HQ company
    const isHq = await this.isHqCompany(companyId);

    if (!isHq) {
      // Not an HQ, skip validation
      this.logger.log(`Company ${companyId} is not an HQ, skipping validation`, "hq-validation");
      return false;
    }

    // If updating department IDs, validate each department
    if (updateDto.department_ids !== undefined) {
      await this.validateDepartmentUpdate(companyId, updateDto.department_ids);
    }

    return true;
  }

  /**
 * Validate department updates to prevent removing departments with active assignments
 * @param companyId The ID of the company being updated
 * @param departmentIds The new department IDs
 */
  private async validateDepartmentUpdate(companyId: string, departmentIds: string[]): Promise<void> {
    // Get child companies
    const childCompanies = await this.getChildCompaniesWithHqProfile(companyId);

    // Get current department mappings for the HQ
    const currentDepartments = await this.companyDepartmentMapService.getDepartmentsByCompanyId(companyId);
    const currentDeptIds = currentDepartments.map(dept => dept.id);

    // Find departments that are being removed
    const removedDeptIds = currentDeptIds.filter(id => !departmentIds.includes(id));

    // Check each removed department
    for (const deptId of removedDeptIds) {
      // Check if department is assigned in HQ
      const isHqAssigned = await this.userRoleAssignmentService.isCompanyDeptAssigned(companyId, deptId);
      if (isHqAssigned) {
        throw new BadRequestException(
          `Cannot remove department ${deptId} because it has active assignments in the HQ company.`
        );
      }

      // Check if department is assigned in any child companies
      for (const childCompany of childCompanies) {
        const isAssigned = await this.userRoleAssignmentService.isCompanyDeptAssigned(childCompany.id, deptId);
        if (isAssigned) {
          throw new BadRequestException(
            `Cannot remove department ${deptId} because it has active assignments in child company ${childCompany.branch}.`
          );
        }
      }
    }
  }

  /**
   * Update child companies based on HQ updates
   * @param hqCompanyId The ID of the HQ company
   * @param updateDto The update data from the HQ
   */
  async updateChildCompaniesFromHq(hqCompanyId: string, updateDto: UpdateMstCompanyDto): Promise<void> {
    // Check if this is an HQ company
    const isHq = await this.isHqCompany(hqCompanyId);

    if (!isHq) {
      // Not an HQ, skip update
      this.logger.log(`Company ${hqCompanyId} is not an HQ, skipping child update`, "hq-update");
      return;
    }

    // Update all child companies
    await this.updateChildCompanies(hqCompanyId, updateDto);

    // Update with HQ profile
    await this.updateChildCompaniesWithHqProfile(hqCompanyId, updateDto);
  }

  private async updateChildCompanies(hqCompanyId: string, updateDto: UpdateMstCompanyDto): Promise<void> {
    // Get all child companies
    const childCompanies = await this.getAllChildCompanies(hqCompanyId);

    // Fields that should be mirrored to all child companies
    const fieldsToMirror = [
      'brand_name',
      'company_name',
      'company_description',
      'unique_url',
      'industry_id',
      'industry',
      'organization_size',
      'organization_type',
      'logo_url',
      'tagline',
      'legal_type',
      'business_license'
    ];

    // Update child companies
    for (const childCompany of childCompanies) {
      this.logger.log(`Updating child company ${childCompany.id} with HQ data`, "hq-child-update");
      const updateData: Partial<MstCompany> = {};

      // Mirror specific fields from HQ to child
      for (const field of fieldsToMirror) {
        if (updateDto[field] !== undefined) {
          updateData[field] = updateDto[field];
        }
      }

      // If there are fields to update, perform the update
      if (Object.keys(updateData).length > 0) {
        await this.mstCompanyRepository.update(childCompany.id, updateData);
        this.logger.log(`Updated child company ${childCompany.id} with HQ data`, "hq-child-update");
      }
    }
  }

  private async updateChildCompaniesWithHqProfile(hqCompanyId: string, updateDto: UpdateMstCompanyDto): Promise<void> {
    // Get child companies that use HQ business profile
    const childCompanies = await this.getChildCompaniesWithHqProfile(hqCompanyId);

    // Fields that should be mirrored to child companies
    const fieldsToMirror = ['website', 'email', 'phone'];

    // Update child companies
    for (const childCompany of childCompanies) {
      if (!childCompany.use_hq_business_profile) {
        // Skip if child company is not using HQ business profile
        continue;
      }

      this.logger.log(`Updating child company ${childCompany.id} with HQ data (business profile)`, "hq-child-update");

      const updateData: Partial<MstCompany> = {};

      // Mirror specific fields from HQ to child
      for (const field of fieldsToMirror) {
        if (updateDto[field] !== undefined) {
          updateData[field] = updateDto[field];
        }
      }

      // If there are fields to update, perform the update
      if (Object.keys(updateData).length > 0) {
        await this.mstCompanyRepository.update(childCompany.id, updateData);
        this.logger.log(`Updated child company ${childCompany.id} with HQ data (business profile)`, "hq-child-update");
      }
    }

    // Handle department updates separately if needed
    if (updateDto.department_ids !== undefined) {
      await this.updateChildCompanyDepartments(updateDto.department_ids, childCompanies);
      this.logger.log(`Updated child company departments for ${childCompanies.length} child companies`, "hq-child-update");
    }
  }

  /**
   * Update department mappings for child companies
   * @param departmentIds The new department IDs
   * @param childCompanies The child companies to update
   */
  private async updateChildCompanyDepartments(
    departmentIds: string[],
    childCompanies: MstCompany[]
  ): Promise<void> {
    // For each child company, update their department mappings
    for (const childCompany of childCompanies) {
      if (!childCompany.use_hq_business_profile) {
        // Skip if child company is not using HQ business profile
        continue;
      }

      await this.companyDepartmentMapService.upsertDepartmentMappings({
        company_id: childCompany.id,
        dept_ids: departmentIds,
      });
      this.logger.log(`Updated department mappings for child company ${childCompany.id}`, "hq-dept-update");
    }
  }

  /**
   * Check if a company is an HQ company
   * @param companyId The ID of the company to check
   * @returns boolean indicating if the company is an HQ
   */
  private async isHqCompany(companyId: string): Promise<boolean> {
    try {
      const hqCompany = await this.companyHqBranchRelationService.getHqCompanyFromBranch(companyId);

      // If hqCompany.id equals companyId, it means the company itself is the HQ
      return hqCompany.id === companyId;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.error(`Company not found during HQ check: ${companyId}`, "hq-check");
        throw new BadRequestException(`Invalid company ID: ${companyId}`);
      }
      throw error;
    }
  }

  /**
   * Get all child companies
   * @param hqCompanyId The ID of the HQ company
   * @returns Array of all child companies
   */
  private async getAllChildCompanies(hqCompanyId: string): Promise<MstCompany[]> {
    return await this.mstCompanyRepository
      .createQueryBuilder("company")
      .where("company.parent_id = :parentId", { parentId: hqCompanyId })
      .getMany();
  }

  /**
   * Get child companies that use the HQ business profile
   * @param hqCompanyId The ID of the HQ company
   * @returns Array of child companies using HQ business profile
   */
  private async getChildCompaniesWithHqProfile(hqCompanyId: string): Promise<MstCompany[]> {
    return await this.mstCompanyRepository
      .createQueryBuilder("company")
      .where("company.parent_id = :parentId", { parentId: hqCompanyId })
      .andWhere("company.use_hq_business_profile = :useHqProfile", { useHqProfile: true })
      .getMany();
  }
}