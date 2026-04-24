import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Query,
  Request,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { MstDepartmentsService } from "./mst_departments.service";
import { MstDepartment } from "./entities/mst_department.entity";
import { CreateMstDepartmentDto } from "./dto/create-mst-department.dto";
import { UpdateMstDepartmentDto } from "./dto/update-mst-department.dto";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "../zfields/fields.service";
import { Response } from "express";

@ApiTags('mst-departments')
@ApiBearerAuth()
@Controller('mst-departments')
export class MstDepartmentsController {
  constructor(
    private readonly mstDepartmentsService: MstDepartmentsService,
    private readonly fieldsService: FieldsService,
  ) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new department',
    description: 'Create a new department with automatic PRIVATE flag and PUBLISHED status'
  })
  @ApiResponse({
    status: 201,
    description: 'Department created successfully',
    type: MstDepartment,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  async create(
    @Body(ValidationPipe) dto: CreateMstDepartmentDto,
  ): Promise<MstDepartment> {
    // Create with optional flags and company mapping
    const department = await this.mstDepartmentsService.create({
      dept_code: dto.dept_code,
      dept_name: dto.dept_name,
      flag: dto.flag,
      status: dto.status,
      companyHqId: dto.companyHqId,
    });

    return department;
  }

  @Get("search")
  @ApiOperation({ summary: "Search with filters", operationId: "search" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({
    name: "filters",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic filters for searching",
    example: { dept_code: "", dept_name: "", flag: "", status: "" },
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "expands", required: false })
  @ApiQuery({
    name: "sortBy",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic sorting",
    example: {
      dept_name: "ASC",
      created_at: "DESC",
    },
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of departments matching the search criteria.",
    type: BasePagination<MstDepartment>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Request() req,
    @Query("id") id?: string,
    @Query("filters") filters?: DynamicFiltersDto,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: any,
    @Query("expands") expands?: string,
    @Query("isExcel") isExcel?: string,
    @Res() res?: Response,
  ) {
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);
    const user: any = req.user;
    return this.fieldsService.search(MstDepartment, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      options: {},
      isExcel,
      res,
      user,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Get all departments',
    description: 'Retrieve all departments'
  })
  @ApiResponse({
    status: 200,
    description: 'Departments retrieved successfully',
    type: [MstDepartment],
  })
  async findAll(): Promise<MstDepartment[]> {
    return await this.mstDepartmentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get department by ID',
    description: 'Retrieve a department by its ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Department retrieved successfully',
    type: MstDepartment,
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  async findById(@Param('id') id: string): Promise<MstDepartment | null> {
    return await this.mstDepartmentsService.findById(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update department by ID',
    description: 'Update a department by its ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Department updated successfully',
    type: MstDepartment,
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: UpdateMstDepartmentDto,
  ): Promise<MstDepartment | null> {
    return await this.mstDepartmentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete department by ID',
    description: 'Delete a department by its ID if not mapped to any company'
  })
  @ApiResponse({
    status: 200,
    description: 'Department deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete department that is mapped to companies',
  })
  @ApiResponse({
    status: 404,
    description: 'Department not found',
  })
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    const result = await this.mstDepartmentsService.delete(id);
    return { success: result };
  }
}
