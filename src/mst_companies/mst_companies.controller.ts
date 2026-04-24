import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  Res,
  UseInterceptors,
  HttpException,
  HttpStatus,
  UploadedFile,
} from "@nestjs/common";
import { MstCompaniesService } from "./service/mst_companies.service";
import { CreateMstCompanyDto } from "./dto/create-mst_company.dto";
import { UpdateMstCompanyDto } from "./dto/update-mst_company.dto";
import { MstCompanyResponseDto } from "./dto/mst-company-response.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { MstCompany } from "./entities/mst_company.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { UpsertMemberDto } from "./dto/upsert-member.dto";
import { TransferOwnershipDto } from "./dto/transfer-ownership.dto";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { MstDepartmentResponseDto } from "src/mst_departments/dto/mst_department_response.dto";
import { CompanyBranchResponseDto } from "./dto/company-branch-response.dto";
import { CompanyMemberResponseDto } from "./dto/company-member-response.dto";
import { UpsertMemberResponseDto } from "./dto/upsert-member-response.dto";
import { MstCompanyHqBranchRelationService } from "./service/company_hq_branch_relation.service";
import { MstCompanyMemberService } from "./service/company_member.service";
import { HqTransferOwnershipService } from "./service/hq_transfer_ownership.service";
import { CompanyMemberDetailResponseDto } from "./dto/company-member-detail-response.dto";
import { UserRoleAssignmentStatus } from "src/user_role_assignments/enums/user_role_assignment.enums";
import { CompanyMetricsResponseDto } from "./dto/company-metrics-response.dto";
import { BasePaginationCompanyMember } from "./dto/base-pagination-company-member.dto";
import { LoggingService } from "src/logs/logs.service";

@Controller("mst-companies")
@ApiTags("mst-companies")
@ApiBearerAuth()
export class MstCompaniesController {
  constructor(
    private readonly mstCompaniesService: MstCompaniesService,
    private readonly fieldsService: FieldsService,
    private readonly companyHqBranchRelationService: MstCompanyHqBranchRelationService,
    private readonly mstCompanyMemberService: MstCompanyMemberService,
    private readonly hqTransferOwnershipService: HqTransferOwnershipService,
    private readonly loggingService: LoggingService
  ) { }

  @Get("search")
  @ApiOperation({ summary: "Search with filters", operationId: "search" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "expands", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "showAvailableJobCount", required: false, type: Boolean })
  @ApiQuery({
    name: "filters",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic filters for searching. company_name uses exact match, company_name_fuzzy uses ILIKE (fuzzy search), other string fields use ILIKE. Cannot use both company_name and company_name_fuzzy at the same time.",
    example: { company_name: "Google", company_name_fuzzy: "PT Company", email: "", phone: "" },
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic sorting",
    example: {
      created_at: "DESC",
    },
  })
  @ApiQuery({
    name: "isExcel",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of users matching the search criteria.",
    type: BasePagination<MstCompanyResponseDto>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Request() req,
    @Query("id") id?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("expands") expands?: string,
    @Query("filters") filters?: DynamicFiltersDto,
    @Query("sortBy") sortBy?: any,
    @Query("isExcel") isExcel?: string,
     @Query("showAvailableJobCount") showAvailableJobCount?: boolean,
    @Res() res?: Response,
  ) {
    return await this.mstCompaniesService.search(
      id,
      filters,
      page,
      limit,
      sortBy,
      expands,
      isExcel,
      res,
      req.user,
      showAvailableJobCount,
    );
  }

  @Post("import-xls")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads", // Direktori sementara
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validasi tipe file
        const allowedTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new HttpException(
              "Hanya file Excel yang diperbolehkan.",
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException("File tidak ditemukan.", HttpStatus.BAD_REQUEST);
    }
    return this.fieldsService.importFromExcel(MstCompany, file);
  }

  @Get("departments/:id")
  @ApiOperation({
    summary: "Get departments assigned to a company",
    description: "Retrieves all PUBLISHED departments mapped to a specific company. Useful for displaying department lists in company context.",
    operationId: "getCompanyDepartments"
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "List of departments assigned to the company",
    type: BasePagination<MstDepartmentResponseDto>
  })
  getCompanyDepartments(
    @Param("id") id: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ): Promise<BasePagination<MstDepartmentResponseDto>> {
    return this.companyHqBranchRelationService.getCompanyDepartments(id, page, limit);
  }

  @Get("available-departments/:id")
  @ApiOperation({
    summary: "Get departments available for the company",
    description: "Returns all departments that can be assigned to a company, including both company-specific and global departments. Always searches within the headquarters scope - if a branch ID is provided, it automatically locates the parent HQ. Only returns departments with PUBLISHED status.",
    operationId: "getAvailableDepartments"
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Available departments for the company",
    type: BasePagination<MstDepartmentResponseDto>
  })
  getAvailableDepartments(
    @Param("id") id: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ): Promise<BasePagination<MstDepartmentResponseDto>> {
    return this.companyHqBranchRelationService.getAvailableDepartments(id, page, limit);
  }

  @Get("available-branches/:companyId")
  @ApiOperation({
    summary: "Get available branches for a company HQ",
    description: "Returns all branches (including HQ) for a company. Accepts either a company ID or HQ ID - if a branch ID is provided, it automatically resolves to the parent HQ. Used for dropdown options where branch names are displayed but company IDs are used as values.",
    operationId: "getAvailableBranches"
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Available branches for the company HQ",
    type: BasePagination<CompanyBranchResponseDto>
  })
  getAvailableBranches(
    @Request() req,
    @Param("companyId") companyId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ): Promise<BasePagination<CompanyBranchResponseDto>> {
    return this.companyHqBranchRelationService.getAvailableBranches(companyId, page, limit, req.user?.id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new company", operationId: "create" })
  @ApiResponse({
    status: 201,
    description: "Company created successfully",
    type: MstCompanyResponseDto
  })
  create(@Body() createMstCompanyDto: CreateMstCompanyDto): Promise<MstCompanyResponseDto> {
    return this.mstCompaniesService.create(createMstCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all companies", operationId: "findAll" })
  @ApiResponse({
    status: 200,
    description: "List of companies with their departments",
    type: [MstCompanyResponseDto]
  })
  findAll(): Promise<MstCompanyResponseDto[]> {
    return this.mstCompaniesService.findAll();
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a company by ID", operationId: "update" })
  @ApiResponse({
    status: 200,
    description: "Company updated successfully",
    type: MstCompanyResponseDto
  })
  update(
    @Param("id") id: string,
    @Body() updateMstCompanyDto: UpdateMstCompanyDto,
  ): Promise<MstCompanyResponseDto> {
    return this.mstCompaniesService.update(id, updateMstCompanyDto);
  }

  @Post("upsert-member")
  @ApiOperation({
    summary: "Create or update a company member",
    operationId: "upsert-member",
  })
  @ApiResponse({
    status: 201,
    description: "Member upserted successfully",
    type: UpsertMemberResponseDto,
  })
  upsertMember(@Body() UpsertMemberDto: UpsertMemberDto, @Request() req) {
    this.loggingService.log(`Upsert member triggered from user ${JSON.stringify(req.user)} with data: ${JSON.stringify(UpsertMemberDto)}`, "member-upsert");
    return this.mstCompanyMemberService.upsertMember(UpsertMemberDto, req.user);
  }

  @Get("members")
  @ApiOperation({
    summary: "Get company members with filtering and pagination",
    operationId: "getMembers",
  })
  @ApiQuery({ name: "company_id", required: false, type: String })
  @ApiQuery({ name: "company_hq_id", required: false, type: String })
  @ApiQuery({ name: "dept_id", required: false, type: String })
  @ApiQuery({ name: "company_role", required: false, type: String })
  @ApiQuery({ name: "full_name", required: false, type: String, description: "Filter by user full name (ILIKE)" })
  @ApiQuery({ name: "email", required: false, type: String, description: "Filter by user email (ILIKE)" })
  @ApiQuery({ name: "status", required: false, enum: UserRoleAssignmentStatus, description: "Filter by member status: active, inactive" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Company members retrieved successfully",
    type: BasePaginationCompanyMember<CompanyMemberResponseDto>,
  })
  getMembers(
    @Request() req,
    @Query("company_id") companyId?: string,
    @Query("company_hq_id") companyHqId?: string,
    @Query("company_role") companyRole?: string,
    @Query("dept_id") deptId?: string,
    @Query("full_name") fullName?: string,
    @Query("email") email?: string,
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.mstCompanyMemberService.getMembers(companyId, companyHqId, companyRole, deptId, fullName, email, status, page, limit, req.user.id);
  }

  @Delete("members")
  @ApiOperation({
    summary: "Delete company member with cascade logic",
    operationId: "deleteMember",
  })
  @ApiQuery({ name: "user_id", required: true, type: String })
  @ApiQuery({ name: "company_id", required: false, type: String })
  @ApiQuery({ name: "company_hq_id", required: false, type: String })
  @ApiResponse({
    status: 200,
    description: "Member deleted successfully with cascade logic",
  })
  deleteMember(
    @Query("user_id") userId: string,
    @Query("company_id") companyId?: string,
    @Query("company_hq_id") companyHqId?: string,
  ) {
    return this.mstCompanyMemberService.deleteMember(userId, companyId, companyHqId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a company by ID", operationId: "remove" })
  remove(@Param("id") id: string) {
    return this.mstCompaniesService.remove(id);
  }

  @Get("member-detail")
  @ApiOperation({
    summary: "Get detailed member information including encrypted data and role history",
    operationId: "getMemberDetail",
  })
  @ApiQuery({ name: "user_id", required: true, type: String })
  @ApiQuery({ name: "company_hq_id", required: true, type: String })
  @ApiResponse({
    status: 200,
    description: "Member details retrieved successfully",
    type: CompanyMemberDetailResponseDto,
  })
  getMemberDetail(
    @Query("user_id") userId: string,
    @Query("company_hq_id") companyHqId: string,
  ): Promise<CompanyMemberDetailResponseDto> {
    return this.mstCompanyMemberService.getMemberDetail(userId, companyHqId);
  }

  @Get("metrics")
  @ApiOperation({
    summary: "Get company metrics (users, branches, departments)",
    description: "Returns total unique users, branches, and departments for the given company or HQ scope.",
    operationId: "getCompanyMetrics"
  })
  @ApiQuery({ name: "company_hq_id", required: true, type: String, description: "Company HQ ID to scope to a specific company HQ" })
  @ApiQuery({ name: "company_id", required: false, type: String, description: "Optional company ID to scope to a specific company" })
  @ApiResponse({
    status: 200,
    description: "Company metrics retrieved successfully",
    type: CompanyMetricsResponseDto
  })
  getMetrics(
    @Request() req,
    @Query("company_hq_id") companyHqId: string,
    @Query("company_id") companyId?: string,
  ): Promise<CompanyMetricsResponseDto> {
    return this.mstCompaniesService.getCompanyMetrics(companyHqId, companyId, req.user?.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a company by ID", operationId: "findOne" })
  @ApiResponse({
    status: 200,
    description: "Company details with departments",
    type: MstCompanyResponseDto
  })
  findOne(@Param("id") id: string): Promise<MstCompanyResponseDto> {
    return this.mstCompaniesService.findOne(id);
  }

  @Post("transfer-ownership")
  @ApiOperation({
    summary: "Transfer ownership of a company",
    operationId: "transferOwnership",
  })
  @ApiResponse({
    status: 200,
    description: "Ownership transferred successfully",
    example: { success: true, message: "Ownership transferred successfully" },
  })
  transferOwnership(@Body() transferDto: TransferOwnershipDto, @Request() req) {
    return this.hqTransferOwnershipService.transferOwnership(transferDto, req.user);
  }
}
