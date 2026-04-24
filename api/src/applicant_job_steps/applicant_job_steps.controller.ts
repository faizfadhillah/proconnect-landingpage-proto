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
import { ApplicantJobStepsService } from "./applicant_job_steps.service";
import { CreateApplicantJobStepDto } from "./dto/create-applicant_job_step.dto";
import { UpdateApplicantJobStepDto } from "./dto/update-applicant_job_step.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import {
  JobsStepsStatus,
  ApplicantJobStep,
} from "./entities/applicant_job_step.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";

@Controller("applicant-job-steps")
@ApiTags("applicant-job-steps")
@ApiBearerAuth()
export class ApplicantJobStepsController {
  constructor(
    private readonly applicantJobStepService: ApplicantJobStepsService,
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
  @ApiQuery({
    name: "options",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of users matching the search criteria.",
    type: BasePagination<ApplicantJobStep>,
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
    @Query("options") options?: any,
    @Res() res?: Response,
  ) {
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);
    return this.fieldsService.search(ApplicantJobStep, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      isExcel,
      res,
      options,
    });
  }

  @Post()
  @ApiOperation({
    summary: "Create a new ApplicantJobStep",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The ApplicantJobStep has been successfully created.",
    type: ApplicantJobStep,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createApplicantJobStepDto: CreateApplicantJobStepDto) {
    return this.applicantJobStepService.create(createApplicantJobStepDto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update an existing ApplicantJobStep",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The ApplicantJobStep has been successfully updated.",
    type: ApplicantJobStep,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  update(
    @Param("id") id: string,
    @Body() updateApplicantJobStepDto: UpdateApplicantJobStepDto,
  ) {
    return this.applicantJobStepService.update(id, updateApplicantJobStepDto);
  }

  @Get("searchn")
  @ApiOperation({
    summary: "Search ApplicantJobSteps with filters",
    operationId: "search",
  })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "applicantId", required: false })
  @ApiQuery({ name: "jobStepId", required: false })
  @ApiQuery({ name: "status", required: false, enum: JobsStepsStatus })
  @ApiQuery({ name: "notes", required: false })
  @ApiQuery({ name: "attributes", required: false })
  @ApiQuery({ name: "createdAtStart", required: false })
  @ApiQuery({ name: "createdAtEnd", required: false })
  @ApiQuery({ name: "createdBy", required: false })
  @ApiQuery({ name: "updatedAtStart", required: false })
  @ApiQuery({ name: "updatedAtEnd", required: false })
  @ApiQuery({ name: "updatedBy", required: false })
  @ApiQuery({ name: "deletedAtStart", required: false })
  @ApiQuery({ name: "deletedAtEnd", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description:
      "Returns the list of ApplicantJobSteps matching the search criteria.",
    type: BasePagination<ApplicantJobStep>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  async searchn(
    @Query("id") id?: string,
    @Query("applicantId") applicantId?: string,
    @Query("jobStepId") jobStepId?: string,
    @Query("status") status?: JobsStepsStatus,
    @Query("notes") notes?: string,
    @Query("attributes") attributes?: string,
    @Query("createdAtStart") createdAtStart?: string,
    @Query("createdAtEnd") createdAtEnd?: string,
    @Query("createdBy") createdBy?: string,
    @Query("updatedAtStart") updatedAtStart?: string,
    @Query("updatedAtEnd") updatedAtEnd?: string,
    @Query("updatedBy") updatedBy?: string,
    @Query("deletedAtStart") deletedAtStart?: string,
    @Query("deletedAtEnd") deletedAtEnd?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.applicantJobStepService.search({
      id,
      applicantId,
      jobStepId,
      status,
      notes,
      attributes: attributes ? JSON.parse(attributes) : undefined,
      createdAt: {
        start: createdAtStart ? new Date(createdAtStart) : undefined,
        end: createdAtEnd ? new Date(createdAtEnd) : undefined,
      },
      createdBy,
      updatedAt: {
        start: updatedAtStart ? new Date(updatedAtStart) : undefined,
        end: updatedAtEnd ? new Date(updatedAtEnd) : undefined,
      },
      updatedBy,
      deletedAt: {
        start: deletedAtStart ? new Date(deletedAtStart) : undefined,
        end: deletedAtEnd ? new Date(deletedAtEnd) : undefined,
      },
      page,
      limit,
    });
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a ApplicantJobStep by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The ApplicantJobStep has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "ApplicantJobStep not found." })
  remove(@Param("id") id: string) {
    return this.applicantJobStepService.remove(id);
  }
}
