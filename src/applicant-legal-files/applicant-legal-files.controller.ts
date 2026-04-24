// src\applicant-legal-files\applicant-legal-files.controller.ts
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
import { ApplicantLegalFilesService } from "./applicant-legal-files.service";
import { CreateApplicantLegalFileDto } from "./dto/create-applicant-legal-file.dto";
import { UpdateApplicantLegalFileDto } from "./dto/update-applicant-legal-file.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import {
  ApplicantLegalFile,
} from "./entities/applicant-legal-file.entity";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";

@Controller("applicant-legal-files")
@ApiTags("applicant-legal-files")
@ApiBearerAuth()
export class ApplicantLegalFilesController {
  constructor(
    private readonly applicantLegalFilesService: ApplicantLegalFilesService,
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
    example: { applicant_id: "", file_name: "", file_type: "" },
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
    type: BasePagination<ApplicantLegalFile>,
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
    return this.fieldsService.search(ApplicantLegalFile, {
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
  @ApiOperation({
    summary: "Create a new applicant legal file",
    operationId: "create",
  })
  create(@Body() createApplicantLegalFileDto: CreateApplicantLegalFileDto) {
    return this.applicantLegalFilesService.create(createApplicantLegalFileDto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all applicant legal files",
    operationId: "findAll",
  })
  findAll() {
    return this.applicantLegalFilesService.findAll();
  }

  @Get(":applicantId")
  @ApiOperation({
    summary: "Get applicant legal files by applicant ID",
    operationId: "findByApplicantId",
  })
  findByApplicantId(@Param("applicantId") applicantId: string) {
    return this.applicantLegalFilesService.findByApplicantId(applicantId);
  }

  @Patch(":applicantId")
  @ApiOperation({
    summary: "Update an applicant legal file",
    operationId: "update",
  })
  update(
    @Param("applicantId") applicantId: string,
    @Body() updateApplicantLegalFileDto: UpdateApplicantLegalFileDto,
  ) {
    return this.applicantLegalFilesService.update(
      applicantId,
      updateApplicantLegalFileDto,
    );
  }

  @Delete(":applicantId")
  @ApiOperation({
    summary: "Delete an applicant legal file",
    operationId: "remove",
  })
  remove(@Param("applicantId") applicantId: string) {
    return this.applicantLegalFilesService.remove(applicantId);
  }
}
