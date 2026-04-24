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
import { ApplicantStepsService } from "./applicant-steps.service";
import { CreateApplicantStepDto } from "./dto/create-applicant-step.dto";
import { UpdateApplicantStepDto } from "./dto/update-applicant-step.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { ApplicantStep } from "./entities/applicant-step.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";

@Controller("applicant-steps")
@ApiTags("applicant-steps")
@ApiBearerAuth()
export class ApplicantStepsController {
  constructor(
    private readonly applicantStepsService: ApplicantStepsService,
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
    example: { applicant_id: "", step: "", status: "" },
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
    type: BasePagination<ApplicantStep>,
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
    return this.fieldsService.search(ApplicantStep, {
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
    summary: "Create a new applicant step",
    operationId: "create",
  })
  create(@Body() createApplicantStepDto: CreateApplicantStepDto) {
    return this.applicantStepsService.create(createApplicantStepDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all applicant steps", operationId: "findAll" })
  findAll() {
    return this.applicantStepsService.findAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get an applicant step by applicant ID",
    operationId: "findOne",
  })
  findOne(@Param("id") id: string) {
    return this.applicantStepsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an applicant step", operationId: "update" })
  update(
    @Param("id") id: string,
    @Body() updateApplicantStepDto: UpdateApplicantStepDto,
  ) {
    return this.applicantStepsService.update(id, updateApplicantStepDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an applicant step", operationId: "remove" })
  remove(@Param("id") id: string) {
    return this.applicantStepsService.remove(id);
  }
}
