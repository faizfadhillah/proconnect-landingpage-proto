import {
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LoggingService } from "src/logs/logs.service";
import { CompanyDepartmentMapService } from "src/company_department_map/company_department_map.service";
import { MstCompany } from "../entities/mst_company.entity";
import { CompanyBranchResponseDto } from "../dto/company-branch-response.dto";
import { BasePagination } from "src/base.pagination";
import { MstDepartmentResponseDto } from "src/mst_departments/dto/mst_department_response.dto";
import { CreateMstCompanyDto } from "../dto/create-mst_company.dto";
import { UpdateMstCompanyDto } from "../dto/update-mst_company.dto";
import { MstIndustry } from "src/mst_industries/entities/mst_industry.entity";
import { ScopeFilterService } from "src/rbac/scope-filter.service";
import { PermissionName } from "src/rbac/rbac.constants";

@Injectable()
export class MstCompanyHqBranchRelationService {
  constructor(
    @InjectRepository(MstCompany)
    private mstCompanyRepository: Repository<MstCompany>,
    private readonly logger: LoggingService,
    @Inject(forwardRef(() => CompanyDepartmentMapService))
    private readonly companyDepartmentMapService: CompanyDepartmentMapService,
    @InjectRepository(MstIndustry)
    private mstIndustryRepository: Repository<MstIndustry>,
    private readonly scopeFilterService: ScopeFilterService,
  ) { }


  /**
   * Populate department_ids from parent company if using HQ business profile
   * @param dto The DTO containing parent_id and use_hq_business_profile
   * @param department_ids The current department_ids array
   * @param companyId Optional company ID for logging
   * @returns Updated department_ids array
   */
  public async populateDepartmentIdsFromParent(dto: CreateMstCompanyDto | UpdateMstCompanyDto, department_ids: string[], companyId?: string): Promise<string[]> {
    if (dto.parent_id && dto.use_hq_business_profile) {
      const parent = await this.mstCompanyRepository.findOneBy({ id: dto.parent_id });
      const departments = await this.companyDepartmentMapService.getDepartmentsByCompanyId(parent.id);
      const newDepartmentIds = departments.map((department) => department.id);
      this.logger.log(`Populate department ids for company: ${companyId || 'new'} same with HQ, with dept ids: ${newDepartmentIds}`, "company-populate-depts");
      return newDepartmentIds;
    }
    return department_ids;
  }

  /**
   * Setup company relations like industry and parent company
   * @param company The company entity to setup
   * @param dto The DTO containing industry_id and parent_id
   */
  public async setupCompanyRelations(company: MstCompany, dto: CreateMstCompanyDto | UpdateMstCompanyDto): Promise<void> {
    if (dto.industry_id) {
      const industry = await this.mstIndustryRepository.findOneBy({
        id: dto.industry_id,
      });
      if (!industry) {
        this.logger.error(`Industry not found: ${dto.industry_id}`, "company-setup");
        throw new NotFoundException(
          `Industry with ID ${dto.industry_id} not found`,
        );
      }
      company.industry = industry.name;
    }

    if (dto.parent_id) {
      const parent = await this.mstCompanyRepository.findOneBy({
        id: dto.parent_id,
      });
      if (!parent) {
        this.logger.error(`Parent company not found: ${dto.parent_id}`, "company-setup");
        throw new NotFoundException(
          `Parent company with ID ${dto.parent_id} not found`,
        );
      }

      // Copy from parent attributes
      company.parent_id = parent.id;
      company.brand_name = parent.brand_name;
      company.company_name = parent.company_name;
      company.company_description = parent.company_description;
      company.unique_url = parent.unique_url;
      company.industry_id = parent.industry_id;
      company.industry = parent.industry;
      company.organization_size = parent.organization_size;
      company.organization_type = parent.organization_type;
      company.logo_url = parent.logo_url;
      company.tagline = parent.tagline;
      company.legal_type = parent.legal_type;
      company.business_license = parent.business_license;

      if (dto.use_hq_business_profile) {
        company.website = parent.website;
        company.email = parent.email;
        company.phone = parent.phone;
      }
    }
  }

  /**
   * Checks for duplicate company with branch and parent combinations in the database.
   * Validates uniqueness of company_name + branch + parent_id combination.
   * @param company_name The name of the company to check.
   * @param branch_name Optional branch name to check for duplicates.
   * @param excludeId Optional ID to exclude from the check (for updates).
   * @param parent_id Optional parent ID to check for duplicates.
   * @returns The duplicate company if found, otherwise undefined.
   */
  public async checkDuplicateCompany(
    company_name: string,
    branch_name?: string,
    excludeId?: string,
    parent_id?: string | null,
  ) {
    const queryBuilder = this.mstCompanyRepository
      .createQueryBuilder("company")
      .where("LOWER(company.company_name) = LOWER(:company_name)", {
        company_name: company_name,
      })
      .andWhere("company.deleted_at IS NULL"); // Exclude soft-deleted records

    // Handle branch matching
    // If branch_name is provided, match exactly (case-insensitive)
    // If branch_name is empty/null, match NULL or empty string
    if (branch_name && branch_name.trim() !== "") {
      queryBuilder.andWhere("LOWER(company.branch) = LOWER(:branch_name)", {
        branch_name: branch_name,
      });
    } else {
      queryBuilder.andWhere("(company.branch IS NULL OR company.branch = '')");
    }

    // Handle parent_id matching
    // If parent_id is provided, match exactly
    // If parent_id is null (HQ company), match NULL
    if (parent_id !== undefined && parent_id !== null) {
      queryBuilder.andWhere("company.parent_id = :parent_id", {
        parent_id: parent_id,
      });
    } else {
      queryBuilder.andWhere("company.parent_id IS NULL");
    }

    // Exclude current record for update operations
    if (excludeId) {
      queryBuilder.andWhere("company.id != :excludeId", { excludeId });
    }

    const result = await queryBuilder.getOne();

    if (result) {
      this.logger.warn(`Duplicate company found: ${company_name} with branch "${branch_name}" and parent_id "${parent_id}"`, "company-duplicate", { companyId: result.id });
    }

    return result;
  }

  /**
   * Assembles child companies (branches) for a given company by setting their parent_id.
   * @param company The company entity for which to assemble children.
   * @returns An array of child companies that were updated, or undefined if no HQ found.
   */
  public async assembleChild(company: MstCompany) {
    this.logger.log(`Assembling child companies for: ${company.company_name}`, "company-assemble");
    if (company.branch) {
      const queryBuilder = this.mstCompanyRepository
        .createQueryBuilder("company")
        .where("LOWER(company.company_name) = LOWER(:company_name)", {
          company_name: company.company_name,
        })
        .andWhere(
          "(LOWER(company.branch) IS NULL OR LOWER(company.branch) = '')",
        );

      company = await queryBuilder.getOne();
      if (!company) {
        this.logger.warn(`No HQ company found for: ${company.company_name}`, "company-assemble");
        return;
      }
    }

    const childCompanies = await this.mstCompanyRepository
      .createQueryBuilder("company")
      .where("LOWER(company.company_name) = LOWER(:company_name)", {
        company_name: company.company_name,
      })
      .andWhere("company.branch IS NOT NULL")
      .andWhere("company.branch != ''")
      .andWhere("company.id != :currentCompanyId", {
        currentCompanyId: company.id,
      })
      .getMany();

    if (childCompanies.length > 0) {
      await this.mstCompanyRepository
        .createQueryBuilder()
        .update(MstCompany)
        .set({ parent_id: company.id })
        .whereInIds(childCompanies.map((child) => child.id))
        .execute();

      this.logger.log(`Updated ${childCompanies.length} child companies for: ${company.company_name}`, "company-assemble");
    }

    return childCompanies;
  }

  /**
      * Get departments assigned to a company
      */
  async getCompanyDepartments(
    companyId: string,
    page?: number,
    limit?: number,
  ): Promise<BasePagination<MstDepartmentResponseDto>> {
    const company = await this.mstCompanyRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    return await this.companyDepartmentMapService.getDepartmentsByCompanyIdPaginated(companyId, page, limit);
  }

  /**
   * Get available departments for a company (based on HQ)
   */
  async getAvailableDepartments(
    companyId: string,
    page?: number,
    limit?: number,
  ): Promise<BasePagination<MstDepartmentResponseDto>> {
    const company = await this.mstCompanyRepository.findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }
    const hqCompany = await this.getHqCompanyFromBranch(companyId);
    const finalCompanyHqId = hqCompany?.id || company.id;
    return await this.companyDepartmentMapService.getAvailableDepartmentsByCompanyHqId(finalCompanyHqId, page, limit);
  }

  /**
   * Get available branches for a company HQ
   * Accepts either a company ID or HQ ID - if a branch ID is provided, it automatically resolves to the parent HQ
   */
  async getAvailableBranches(
    companyId: string,
    page?: number,
    limit?: number,
    userId?: string,
    excludeHq?: boolean,
  ): Promise<BasePagination<CompanyBranchResponseDto>> {
    // Get HQ company from branch (handles both HQ and branch IDs)
    const hqCompany = await this.getHqCompanyFromBranch(companyId);
    if (!hqCompany) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // Apply scope filtering if userId is provided
    let allowedCompanyIds: string[] | null = null;
    if (userId) {
      const scopeInfo = await this.scopeFilterService.getScopeInfo(userId);
      
      if (!scopeInfo.isSysAdmin) {
        const requiredPermissions = [
          PermissionName.TEAM_MGMT_VIEW,
          PermissionName.VIEW_PROFILE_ORG_OVERVIEW_VIEW
        ];
        
        allowedCompanyIds = await this.scopeFilterService.getAvailableCompanyIdsForPermissions(
          scopeInfo,
          requiredPermissions
        );

        // Check if user has access to the requested HQ
        // For branch-level permissions, allowedCompanyIds contains branch company IDs
        // We need to check if the requested HQ is the HQ of any allowed company
        if (allowedCompanyIds.length === 0) {
          throw new ForbiddenException(`You do not have access to view branches for this company HQ`);
        }
      }
    }

    // Build query
    let queryBuilder = this.mstCompanyRepository
      .createQueryBuilder("company")
      .where("company.company_name = :company_name", {
        company_name: hqCompany.company_name,
      })
      .andWhere("company.deleted_at IS NULL");

    // Apply scope filter if userId is provided and not sys admin
    if (userId && allowedCompanyIds !== null && allowedCompanyIds.length > 0) {
      queryBuilder.andWhere("company.id IN (:...allowedCompanyIds)", {
        allowedCompanyIds,
      });
    }

    // Exclude HQ if requested
    if (excludeHq) {
      queryBuilder.andWhere("company.parent_id IS NOT NULL");
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply ordering and pagination
    queryBuilder
      .orderBy("company.parent_id", "ASC", "NULLS FIRST")
      .addOrderBy("company.branch", "ASC");

    if (page && limit) {
      queryBuilder = queryBuilder.skip((page - 1) * limit).take(limit);
    }

    const companies = await queryBuilder.getMany();

    // Map to response DTO
    const items = companies.map(company => {
      const dto = new CompanyBranchResponseDto();
      dto.id = company.id;
      dto.company_name = company.company_name;
      dto.branch = company.branch;
      dto.display_name = company.isHqCompany() ? 'Headquarters' : company.branch;
      dto.location = company.location;
      return dto;
    });

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
   * Get HQ company from a branch company
   * @param branchCompanyId - ID of the branch company
   * @returns HQ company (company with same name but no branch)
   */
  public async getHqCompanyFromBranch(branchCompanyId: string): Promise<MstCompany> {
    // First, find the branch company
    const branchCompany = await this.mstCompanyRepository.findOne({
      where: { id: branchCompanyId }
    });

    if (!branchCompany) {
      this.logger.error(`Branch company not found: ${branchCompanyId}`, "company-hq-lookup");
      throw new NotFoundException(`Branch company with ID ${branchCompanyId} not found`);
    }

    // If this is already an HQ company (no branch), return it
    if (branchCompany.isHqCompany()) {
      return branchCompany;
    }

    // Find the HQ company (same company_name but no branch)
    const hqCompany = await this.mstCompanyRepository
      .createQueryBuilder("company")
      .where("company.company_name = :company_name", {
        company_name: branchCompany.company_name,
      })
      .andWhere("(company.branch IS NULL OR company.branch = '')")
      .getOne();

    if (!hqCompany) {
      this.logger.warn(`No HQ company found for: ${branchCompany.company_name}`, "company-hq-lookup");
    }

    return hqCompany;
  }
}
