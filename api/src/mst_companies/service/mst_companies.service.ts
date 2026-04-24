import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstCompanyDto } from "../dto/create-mst_company.dto";
import { UpdateMstCompanyDto } from "../dto/update-mst_company.dto";
import { MstCompanyResponseDto } from "../dto/mst-company-response.dto";
import { MstCompany } from "../entities/mst_company.entity";
import { UserRoleAssignmentService } from "src/user_role_assignments/services/user_role_assignments.service";
import { UserRoleAssignmentCompanyRole } from "src/user_role_assignments/enums/user_role_assignment.enums";
import { LoggingService } from "src/logs/logs.service";
import { CompanyDepartmentMapService } from "src/company_department_map/company_department_map.service";
import { FieldsService } from "src/zfields/fields.service";
import { FiltersUtil } from "src/zfields/filters.util";
import { Response } from "express";
import { MstCompaniesUtils } from "../mst_companies.utils";
import { MstCompanyHqBranchRelationService } from "./company_hq_branch_relation.service";
import { HqBranchMirrorService } from "./hq_branch_mirror.service";
import { MstCompaniesDao } from "../dao/mst_companies.dao";
import { CompanyMetricsResponseDto } from "../dto/company-metrics-response.dto";
import { CompanyBranchResponseDto } from "../dto/company-branch-response.dto";
import { ScopeFilterService } from "src/rbac/scope-filter.service";
import { ScopeInfo } from "src/rbac/interfaces/scope-info.interface";
import { PermissionName } from "src/rbac/rbac.constants";
import { UserWithRoles } from "src/users/interfaces/user-with-roles.interface";
import { toNumber } from "src/utils/number.util";

@Injectable()
export class MstCompaniesService {
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
    @Inject(forwardRef(() => HqBranchMirrorService))
    private readonly hqBranchMirrorService: HqBranchMirrorService,
    private readonly mstCompaniesDao: MstCompaniesDao,
    private readonly scopeFilterService: ScopeFilterService,
  ) { }

  async create(createMstCompanyDto: CreateMstCompanyDto): Promise<MstCompanyResponseDto> {
    await this.utils.validateAndPrepareDto(createMstCompanyDto);

    this.logger.log(`Creating company: ${JSON.stringify(createMstCompanyDto)}`, "company-create");

    const company = this.mstCompanyRepository.create();
    this.utils.assignDtoToEntity(company, createMstCompanyDto, ['department_ids']);

    await this.companyHqBranchRelationService.setupCompanyRelations(company, createMstCompanyDto);

    const department_ids = await this.companyHqBranchRelationService.populateDepartmentIdsFromParent(createMstCompanyDto,
      createMstCompanyDto.department_ids,
      company.id);

    try {
      const existingCompany = await this.companyHqBranchRelationService.checkDuplicateCompany(
        company.company_name,
        company.branch,
        undefined,
        company.parent_id,
      );
      if (existingCompany) {
        this.logger.error(`Duplicate company: ${company.company_name}`, "company-create");
        throw new UnprocessableEntityException(
          company.branch
            ? `This company with branch "${company.branch}" already exists`
            : `This company with headquarters already exists`,
        );
      }


      const result = await this.mstCompanyRepository.save(company);

      // Handle department mappings if department_ids provided
      if (department_ids && department_ids.length > 0) {
        try {
          await this.companyDepartmentMapService.upsertDepartmentMappings({
            company_id: result.id,
            dept_ids: department_ids,
          });
        } catch (departmentError) {
          // Manual rollback: delete the company that was just created
          await this.mstCompanyRepository.delete(result.id);

          // Re-throw with specific error message
          throw new UnprocessableEntityException(
            `Failed to assign departments to company. Company creation rolled back. Error: ${departmentError.message}`
          );
        }
      }

      // Update parent id for all child companies if this is HQ
      this.logger.log(`Company created: ${result.id}`, "company-create");

      await this.companyHqBranchRelationService.assembleChild(result);

      return await this.utils.mapToResponseDto(result);
    } catch (error) {
      this.logger.error(`Company creation failed: ${error.message}`, "company-create");
      throw new UnprocessableEntityException(error.message);
    }
  }

  async search(
    id?: string,
    filters?: Record<string, any>,
    page?: number,
    limit?: number,
    sortBy?: any,
    expands?: string,
    isExcel?: string,
    res?: Response,
    user?: UserWithRoles,
    showAvailableJobCount?: boolean,
  ) {
    // Parse filters first to ensure it's an object before applying scope filters
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);

    // Ensure parsedFilters is an object, not a string or other type
    let filtersObj = FiltersUtil.ensureFiltersObject(parsedFilters, "company-search", this.logger);

    // Apply scope filtering if user is provided (after parsing filters)
    if (user) {
      if (!user.isSysAdmin) {
        const scopeInfo = await this.scopeFilterService.getScopeInfo(user.id);
        filtersObj = await this.applyScopeFilters(filtersObj, scopeInfo);
      }
    }

    // Extract company_name and company_name_fuzzy for custom handling
    const companyNameFilter = filtersObj?.company_name;
    const companyNameFuzzyFilter = filtersObj?.company_name_fuzzy;

    // Validate: cannot use both company_name (exact) and company_name_fuzzy (ILIKE) at the same time
    if (companyNameFilter && companyNameFuzzyFilter) {
      throw new BadRequestException("Cannot use both 'company_name' (exact match) and 'company_name_fuzzy' (fuzzy match) filters at the same time. Please use only one.");
    }

    // Remove company_name and company_name_fuzzy from filtersObj to prevent fieldsService from applying default behavior
    // Ensure we always have an object, not a string or other type
    const modifiedFilters: Record<string, any> = {};
    if (filtersObj && typeof filtersObj === 'object' && !Array.isArray(filtersObj)) {
      Object.assign(modifiedFilters, filtersObj);
    }

    if (modifiedFilters.company_name !== undefined) {
      delete modifiedFilters.company_name;
    }
    if (modifiedFilters.company_name_fuzzy !== undefined) {
      delete modifiedFilters.company_name_fuzzy;
    }

    // We need special handling for filter by dept id, since dept id not mapped to company entity but mapped to company_department_map entity.
    if (modifiedFilters && typeof modifiedFilters === 'object' && modifiedFilters.dept_id) {
      const deptId = modifiedFilters.dept_id;
      this.logger.log(`Filtering companies by department ID: ${deptId}`);

      // Get all company IDs mapped to this department
      const companyIds = await this.companyDepartmentMapService.getCompanyMappingsByDeptId(deptId);
      if (companyIds && companyIds.length > 0) {
        // set filter company ids, if exists.
        // Ensure modifiedFilters is an object before assigning
        if (typeof modifiedFilters === 'object' && !Array.isArray(modifiedFilters)) {
          modifiedFilters.id = companyIds;
        } else {
          this.logger.error(`Cannot assign id to modifiedFilters, type: ${typeof modifiedFilters}`, "company-search");
        }
      } else {
        this.logger.log(`No companies found for department ID: ${deptId}`, "company-search");

        // Return empty result instead of string
        const emptyResult = {
          "items": [],
          "meta": {
            "total": 0,
            "page": page ?? 1,
            "limit": limit ?? 10,
            "totalPages": 0
          }
        }

        // If res is provided, send the response directly
        if (res) {
          res.status(200).json(emptyResult);
          return emptyResult;
        }

        return emptyResult;

      }

      // Remove dept_id from filters since we've processed it
      delete modifiedFilters.dept_id;
    }

    // Handle Excel export - if isExcel is true, get all data without pagination
    if (isExcel && isExcel === "true") {
      // For Excel export, use fieldsService.search for Excel to maintain compatibility
      // Note: Excel export will use ILIKE for company_name (not exact match)
      return await this.fieldsService.search(MstCompany, {
        id,
        filters: filtersObj, // Use parsed filters object for Excel
        page,
        limit,
        sortBy: parsedSortBy,
        expands,
        isExcel,
        res,
        user
      });
    }

    this.logger.log(`Search companies with filters: ${JSON.stringify(modifiedFilters)}, company_name: ${companyNameFilter}, company_name_fuzzy: ${companyNameFuzzyFilter} from user id: ${user?.id}`, "company-search");

    // Build custom query builder for company search with special handling:
    // 1. company_name: exact match (not ILIKE)
    // 2. company_name_fuzzy: ILIKE match (fuzzy search)
    // 3. Order by: parent_id ASC, then branch ASC
    const queryBuilder = this.mstCompanyRepository.createQueryBuilder("mst_company");

    // Apply company_name exact match
    if (companyNameFilter) {
      queryBuilder.andWhere("mst_company.company_name = :company_name", { company_name: companyNameFilter });
    }

    // Apply company_name_fuzzy ILIKE match
    if (companyNameFuzzyFilter) {
      queryBuilder.andWhere("mst_company.company_name ILIKE :company_name_fuzzy", { company_name_fuzzy: `%${companyNameFuzzyFilter}%` });
    }

    // Apply other standard filters
    if (id) {
      queryBuilder.andWhere("mst_company.id = :id", { id });
    }

    // Handle other filters from modifiedFilters (excluding company_name and company_name_fuzzy which we already handled)
    // List of UUID fields that should use equality instead of ILIKE
    const uuidFields = ['id', 'parent_id', 'industry_id', 'country_id', 'region_id'];

    Object.keys(modifiedFilters).forEach((key) => {
      const value = modifiedFilters[key];

      if (value !== undefined && value !== null && key !== 'company_name' && key !== 'company_name_fuzzy') {
        // Skip empty arrays
        if (Array.isArray(value) && value.length === 0) {
          return;
        }

        // Skip empty objects
        if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
          return;
        }

        // Check if this is a UUID field first - UUID fields should always use equality, never ILIKE
        if (uuidFields.includes(key)) {
          if (Array.isArray(value) && value.length) {
            queryBuilder.andWhere(`mst_company.${key} IN (:...${key})`, { [key]: value });
          } else if (typeof value === 'string' && value !== '') {
            queryBuilder.andWhere(`mst_company.${key} = :${key}`, { [key]: value });
          }
          // Skip invalid UUID values
        } else if (Array.isArray(value)) {
          if (value.length) {
            queryBuilder.andWhere(`mst_company.${key} IN (:...${key})`, { [key]: value });
          }
        } else if (typeof value === "boolean" || key.includes("is_") || key.includes("has_")) {
          queryBuilder.andWhere(`mst_company.${key} = :${key}`, { [key]: value });
        } else if (typeof value === "string" && value !== '') {
          // For string fields that are NOT UUID fields, use ILIKE (default behavior from fieldsService)
          queryBuilder.andWhere(`mst_company.${key} ILIKE :${key}`, { [key]: `%${value}%` });
        } else {
          // Handle other primitive types (numbers, etc.)
          queryBuilder.andWhere(`mst_company.${key} = :${key}`, { [key]: value });
        }
      }
    });

    // Handle expands (simplified - add basic joins if needed)
    // Add joins BEFORE ordering to ensure alias is available
    if (expands) {
      // Use Set to deduplicate expand fields and normalize "industry" to "industri"
      const expandFieldsSet = new Set(
        expands.split(",").map((item) => {
          const trimmed = item.trim();
          // Normalize "industry" to "industri" to avoid duplicate joins
          return trimmed === "industry" ? "industri" : trimmed;
        })
      );

      expandFieldsSet.forEach((expand) => {
        if (expand === "region") {
          queryBuilder.leftJoinAndSelect("mst_company.region", "region");
        } else if (expand === "industri") {
          queryBuilder.leftJoinAndSelect("mst_company.industri", "industri");
        } else if (expand === "country") {
          queryBuilder.leftJoinAndSelect("mst_company.country", "country");
        } else if (expand === "parent") {
          queryBuilder.leftJoinAndSelect("mst_company.parent", "parent");
        }
      });
    }

    // Apply soft delete filter
    queryBuilder.andWhere("mst_company.deleted_at IS NULL");

    // Apply sortBy from user if provided (adds to the default ordering)
    // parseSortBy can return either an array or an object
    let sortByItems: any[] = [];
    let hasValidSortBy = false;

    if (parsedSortBy) {
      if (Array.isArray(parsedSortBy)) {
        // If it's an array, filter out empty objects and check if there are valid items
        sortByItems = parsedSortBy.filter(item =>
          item &&
          typeof item === 'object' &&
          Object.keys(item).length > 0
        );
        hasValidSortBy = sortByItems.length > 0;
      } else if (typeof parsedSortBy === 'object' && parsedSortBy !== null) {
        // If it's an object, check if it has any keys
        if (Object.keys(parsedSortBy).length > 0) {
          sortByItems = [parsedSortBy];
          hasValidSortBy = true;
        }
      }
    }

    if (hasValidSortBy) {
      // Process each sortBy item
      sortByItems.forEach((sortByItem) => {
        if (sortByItem && typeof sortByItem === 'object') {
          // Handle format: { branch: "ASC" } or { key: 'field', order: 'asc' }
          Object.keys(sortByItem).forEach((key) => {
            const sortValue = sortByItem[key];
            let order = 'ASC';

            // Determine order value
            if (sortValue) {
              if (typeof sortValue === 'string') {
                order = sortValue.toUpperCase();
              } else if (typeof sortValue === 'object' && sortValue.order) {
                // Handle format: { key: 'field', order: 'asc' }
                order = typeof sortValue.order === 'string' ? sortValue.order.toUpperCase() : 'ASC';
              }
            }

            // Validate order is either ASC or DESC
            if (order !== 'ASC' && order !== 'DESC') {
              order = 'ASC';
            }

            // Special handling for location, phone, and email fields
            // These fields should put null and empty string values at the bottom
            const fieldsWithNullsLast = ['location', 'phone', 'email'];
            if (fieldsWithNullsLast.includes(key)) {
              // Use NULLIF to convert empty string to null, then COLLATE "C" for proper sorting, then NULLS LAST to put them at bottom.
              // IMPORTANT: use a select alias for the expression so TypeORM doesn't misinterpret "NULLIF(mst_company" as an alias name.
              const sortAlias = `${key}_sort`;
              queryBuilder.addSelect(`NULLIF(mst_company.${key}, '') COLLATE "C"`, sortAlias);
              queryBuilder.addOrderBy(sortAlias, order as "ASC" | "DESC", "NULLS LAST");
            } else {
              queryBuilder.addOrderBy(`mst_company.${key}`, order as "ASC" | "DESC");
            }
          });
        }
      });
    } else {
      // default sort by parent_id ASC NULLS FIRST (HQ companies with NULL parent_id will be on top)
      queryBuilder.addOrderBy("mst_company.parent_id", "ASC", "NULLS FIRST");
      queryBuilder.addOrderBy("mst_company.branch", "ASC");
    }

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination - ensure page and limit are numbers
    const pageNum = toNumber(page, 1);
    const limitNum = toNumber(limit, 10);
    
    if (limitNum > 0) {
      queryBuilder.skip((pageNum - 1) * limitNum).take(limitNum);
    }

    // Execute query
    const items = await queryBuilder.getMany();

    // Map to response DTOs
    const mappedItems = await this.utils.mapToResponseDtoArray(items);

    // Calculate pagination metadata
    const totalPages = limitNum > 0 ? Math.ceil(total / limitNum) : 1;

    // Optionally enrich with available job counts per company
    if (showAvailableJobCount) {
      const companyIds = items.map((company) => company.id);
      const jobCounts = await this.mstCompaniesDao.findAvailableJobCountGroupedByCompany(companyIds);

      mappedItems.forEach((item) => {
        (item as MstCompanyResponseDto).available_job_count = jobCounts[item.id] ?? 0;
      });
    }

    const result = {
      items: mappedItems,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };

    // Override the response with our modified data
    if (res) {
      res.status(200).json(result);
    }

    this.logger.log(`Companies found: ${items.length} items from total ${total}`, "company-search");

    return result;
  }

  async findAll(): Promise<MstCompanyResponseDto[]> {
    const companies = await this.mstCompanyRepository.find();
    return await this.utils.mapToResponseDtoArray(companies);
  }

  async findOne(id: string): Promise<MstCompanyResponseDto> {
    const company = await this.mstCompanyRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return await this.utils.mapToResponseDto(company);
  }

  async update(
    id: string,
    updateMstCompanyDto: UpdateMstCompanyDto,
  ): Promise<MstCompanyResponseDto> {
    await this.utils.validateAndPrepareDto(updateMstCompanyDto);

    const company = await this.mstCompanyRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // Store original state for potential rollback
    const originalCompany = { ...company };

    this.utils.assignDtoToEntity(company, updateMstCompanyDto, ['department_ids']);

    await this.companyHqBranchRelationService.setupCompanyRelations(company, updateMstCompanyDto);

    const department_ids = await this.companyHqBranchRelationService.populateDepartmentIdsFromParent(updateMstCompanyDto,
      updateMstCompanyDto.department_ids,
      company.id);

    // Validate HQ update before proceeding
    await this.hqBranchMirrorService.validateHqUpdate(id, updateMstCompanyDto);

    try {
      const existingCompany = await this.companyHqBranchRelationService.checkDuplicateCompany(
        company.company_name,
        company.branch,
        company.id,
        company.parent_id,
      );
      if (existingCompany) {
        throw new UnprocessableEntityException(
          company.branch
            ? `This company with branch "${company.branch}" already exists`
            : `This company with headquarters already exists`,
        );
      }

      await this.mstCompaniesDao.update(id, company);

      // Handle department mappings with rollback protection
      await this.handleDepartmentMappings(id, department_ids, originalCompany);

      // Update child companies if this is an HQ
      // Make it async and silent error
      try {
        this.hqBranchMirrorService.updateChildCompaniesFromHq(id, updateMstCompanyDto);
      } catch (error) {
        this.logger.error(`Failed to update child companies from HQ. Error: ${error.message}`, "hq-child-update");
      }

      await this.companyHqBranchRelationService.assembleChild(company);

      return await this.utils.mapToResponseDto(company);
    } catch (error) {
      // Re-throw the error (could be validation error, duplicate error, or department error)
      throw new UnprocessableEntityException(error.message);
    }
  }

  /**
   * Handle department mappings with rollback protection
   * @param companyId The company ID
   * @param departmentIds The department IDs to assign (can be empty array to clear all)
   * @param originalCompany The original company state for rollback
   */
  private async handleDepartmentMappings(
    companyId: string,
    departmentIds: string[],
    originalCompany: Partial<MstCompany>,
  ): Promise<void> {
    // Check if we need to update department mappings
    const existingDepartments = await this.companyDepartmentMapService.getDepartmentsByCompanyId(companyId);
    const hasExistingDepartments = existingDepartments.length > 0;
    const hasNewDepartments = departmentIds && departmentIds.length > 0;

    // Only proceed if there are changes to department mappings
    if (!hasExistingDepartments && !hasNewDepartments) {
      return; // No departments to manage
    }

    // Determine the action and log message
    let action: string;
    let deptIdsToUpsert: string[];

    if (hasNewDepartments) {
      action = 'updating';
      deptIdsToUpsert = departmentIds;
    } else {
      action = 'clearing';
      deptIdsToUpsert = [];
    }

    this.logger.log(`${action} department mappings for company ${companyId}, department_ids: ${deptIdsToUpsert}`);

    try {
      await this.companyDepartmentMapService.upsertDepartmentMappings({
        company_id: companyId,
        dept_ids: deptIdsToUpsert,
      });
    } catch (departmentError) {
      // Manual rollback: restore original company data
      await this.mstCompanyRepository.save(originalCompany as MstCompany);

      // Re-throw with specific error message
      throw new UnprocessableEntityException(
        `Failed to update department mappings. Company changes rolled back. Error: ${departmentError.message}`
      );
    }
  }


  async remove(id: string, skipHqValidation: boolean = false): Promise<void> {
    this.logger.log(`Removing company: ${id}`);

    // Get the company first to check if it exists and to update its name if it's a branch
    const company = await this.mstCompanyRepository.findOne({ where: { id } });
    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    // Get HQ company (getHqCompanyFromBranch already validates company existence and returns HQ or the company itself if it's HQ)
    const hqCompany = await this.companyHqBranchRelationService.getHqCompanyFromBranch(id);
    const isHq = hqCompany.id === id;

    // Check for active assignments before deletion
    if (isHq && !skipHqValidation) {
      // Cannot delete HQ company (unless skipHqValidation is true)
      throw new UnprocessableEntityException(
        `Cannot delete company ${id}: This is a HQ company`
      );
    } else if (!isHq) {
      this.logger.log(`Checking assignments for branch company ${id}`);
      const hasAssignment = await this.userRoleAssignmentService.isCompanyAssigned(id);
      if (hasAssignment) {
        throw new UnprocessableEntityException(
          `Cannot delete company ${id}: There are active user assignments.`
        );
      }

    }

    // First soft delete the department mappings for this company
    await this.companyDepartmentMapService.softDeleteMappingsByCompanyId(id);

    // Then soft delete the company itself (DAO handles company_name update with timestamp)
    await this.mstCompaniesDao.softDelete(id);

    this.logger.log(`Company ${id} and its department mappings have been soft deleted`);
  }

  public async removeCompanyFromOwner(ownerId: string): Promise<void> {
    const roleAssignments = await this.userRoleAssignmentService.getActiveByUserId(ownerId);
    if (!roleAssignments) {
      this.logger.error(`User with ID ${ownerId} is not an owner of any company`);
      return;
    }

    const filteredRoleAssignments = roleAssignments
      .filter(roleAssignment => roleAssignment.company_role === UserRoleAssignmentCompanyRole.OWNER_HQ);
    if (!filteredRoleAssignments || filteredRoleAssignments.length === 0) {
      this.logger.error(`User with ID ${ownerId} is not an owner of any company`);
      return;
    }

    const companyIds = filteredRoleAssignments.map(roleAssignment => roleAssignment.company_id);
    await this.mstCompaniesDao.softDelete(companyIds);
  }

  /**
   * Get company metrics (users, branches, departments) based on scope
   */
  public async getCompanyMetrics(companyHqId: string, companyId?: string, userId?: string): Promise<CompanyMetricsResponseDto> {
    this.logger.log(`Getting metrics for HQ ID: ${companyHqId}, Company ID: ${companyId}, User ID: ${userId}`);

    // Get unique users (all role assignments, active and inactive) with scope filter
    const users = await this.userRoleAssignmentService.getCompanyMembers(
      companyId,
      companyHqId,
      undefined, // companyRole
      undefined, // deptId
      undefined, // name
      undefined, // email
      undefined, // status
      undefined, // page
      undefined, // limit
      userId // userId for scope filtering
    );
    const totalUsers = new Set(users.map(u => u.user_id)).size;

    // Get unique branches
    let branches: CompanyBranchResponseDto[] = [];
    if (companyId) {
      const company = await this.mstCompanyRepository.findOne({ where: { id: companyId } });
      if (company) {
        branches.push({
          id: company.id,
          company_name: company.company_name,
          branch: company.branch,
          display_name: company.isHqCompany() ? "Headquarters" : company.branch,
          location: company.location,
        });
      }
    } else {
      const branchData = await this.companyHqBranchRelationService.getAvailableBranches(companyHqId, undefined, undefined, userId);
      branches = branchData.items;
    }
    const totalBranches = new Set(branches.map(b => b.id)).size;

    // Get unique departments from members (simple count)
    const totalDepartments = new Set(users.map(u => u.dept_id).filter(id => id !== null && id !== undefined)).size;

    this.logger.log(`Metrics computed: users=${totalUsers}, branches=${totalBranches}, departments=${totalDepartments}`);

    return {
      total_users: totalUsers,
      total_branches: totalBranches,
      total_departments: totalDepartments,
    };
  }

  /**
   * Apply scope filters to the given filters based on user's scope
   * @param filters The original filters
   * @param scopeInfo The user's scope information
   * @returns Updated filters with scope applied
   */
  private async applyScopeFilters(filters: Record<string, any>, scopeInfo: ScopeInfo): Promise<Record<string, any>> {
    if (scopeInfo.isSysAdmin || scopeInfo.isCandidate) {
      this.logger.log(`No filtering for sys admin or candidate`, "scope-filter");
      return filters; // No filtering for sys admin
    }

    if (!filters) {
      filters = {};
    }

    // Filter by company IDs if available
    if (scopeInfo.companyIds.length > 0) {
      let prevFilterId;
      if (filters.id) {
        prevFilterId = filters.id;
      }
      // Ensure prevFilterId is an array, if not, make it []
      if (!Array.isArray(prevFilterId)) {
        prevFilterId = prevFilterId ? [prevFilterId] : [];
      }

      const availableCompanyIds = await this.scopeFilterService.getAvailableCompanyIdsForPermissions(scopeInfo,
        [PermissionName.BUSINESS_PROFILE_VIEW, PermissionName.HQ_BRANCH_INFO_VIEW]);

      filters.id = [
        ...new Set([
          ...(prevFilterId || []),
          ...availableCompanyIds,
        ])
      ]
    }

    this.logger.log(`Applied scope filters for user: ${JSON.stringify(filters)}`, "scope-filter");
    return filters;
  }
}
