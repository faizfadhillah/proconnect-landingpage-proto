// src/company_files.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
} from "@nestjs/common";
import { CompanyFilesService } from "./company_files.service";
import { CreateCompanyFileDto } from "./dto/create-company_file.dto";
import { UpdateCompanyFileDto } from "./dto/update-company_file.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { CompanyFile } from "./entities/company_file.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";

@Controller("company-files")
@ApiTags("company-files")
@ApiBearerAuth()
export class CompanyFilesController {
  constructor(
    private readonly companyFileService: CompanyFilesService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Get("search")
  @ApiOperation({ summary: "Search with filters", operationId: "search" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "expands", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "filters",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic filters for searching",
    example: { company_id: "", file_name: "", file_url: "" },
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
    type: BasePagination<CompanyFile>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Query("id") id?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("expands") expands?: string,
    @Query("filters") filters?: DynamicFiltersDto,
    @Query("sortBy") sortBy?: any,
    @Query("isExcel") isExcel?: string,
    @Res() res?: Response,
  ) {
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);
    return this.fieldsService.search(CompanyFile, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      isExcel,
      res,
    });
  }

  @Post()
  @ApiOperation({ summary: "Create a new CompanyFile", operationId: "create" })
  create(@Body() createCompanyFileDto: CreateCompanyFileDto) {
    return this.companyFileService.create(createCompanyFileDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all CompanyFiles", operationId: "findAll" })
  findAll() {
    return this.companyFileService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a CompanyFile by ID", operationId: "findOne" })
  findOne(@Param("id") id: string) {
    return this.companyFileService.findOne(id);
  }

  @Get("company/:company_id")
  @ApiOperation({
    summary: "Get CompanyFiles by company_id",
    operationId: "findByCompanyId",
  })
  findByCompanyId(@Param("company_id") company_id: string) {
    return this.companyFileService.findByCompanyId(company_id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a CompanyFile by ID",
    operationId: "update",
  })
  update(
    @Param("id") id: string,
    @Body() updateCompanyFileDto: UpdateCompanyFileDto,
  ) {
    return this.companyFileService.update(id, updateCompanyFileDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a CompanyFile by ID",
    operationId: "remove",
  })
  remove(@Param("id") id: string) {
    return this.companyFileService.remove(id);
  }
}
