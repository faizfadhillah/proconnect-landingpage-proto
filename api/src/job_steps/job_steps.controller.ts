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
  Request,
} from "@nestjs/common";
import { JobStepsService } from "./job_steps.service";
import { CreateJobStepDto } from "./dto/create-job_step.dto";
import { UpdateJobStepDto } from "./dto/update-job_step.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { JobStep, JobStepsStatus } from "./entities/job_step.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";
import { User } from "src/users/entities/user.entity";

@Controller("job-steps")
@ApiTags("job-steps")
@ApiBearerAuth()
export class JobStepsController {
  constructor(
    private readonly jobStepsService: JobStepsService,
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
    example: { job_id: "", type: "", step_name: "" },
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
    type: BasePagination<JobStep>,
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
    return this.fieldsService.search(JobStep, {
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
  @ApiOperation({ summary: "Create a new JobStep", operationId: "create" })
  @ApiResponse({
    status: 201,
    description: "The JobStep has been successfully created.",
    type: JobStep,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createJobStepDto: CreateJobStepDto, @Request() req) {
    const user: User = req.user;
    return this.jobStepsService.create(createJobStepDto, user);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a JobStep", operationId: "update" })
  @ApiResponse({
    status: 200,
    description: "The JobStep has been successfully updated.",
    type: JobStep,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  update(@Param("id") id: string, @Body() updateJobStepDto: UpdateJobStepDto) {
    return this.jobStepsService.update(id, updateJobStepDto);
  }

  @Get("searchn")
  @ApiOperation({
    summary: "Search JobSteps with filters",
    operationId: "search",
  })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "jobId", required: false })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "stepName", required: false })
  @ApiQuery({ name: "stepOrder", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, enum: JobStepsStatus })
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
    description: "Returns the list of JobSteps matching the search criteria.",
    type: BasePagination<JobStep>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  async searchn(
    @Query("id") id?: string,
    @Query("jobId") jobId?: string,
    @Query("type") type?: string,
    @Query("stepName") stepName?: string,
    @Query("stepOrder") stepOrder?: number,
    @Query("status") status?: JobStepsStatus,
    @Query("notes") notes?: string,
    @Query("attributes") attributes?: any,
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
    return this.jobStepsService.search({
      id,
      jobId,
      type,
      stepName,
      stepOrder,
      status,
      notes,
      attributes,
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
  @ApiOperation({ summary: "Delete a JobStep by ID", operationId: "remove" })
  @ApiResponse({
    status: 204,
    description: "The JobStep has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "JobStep not found." })
  remove(@Param("id") id: string) {
    return this.jobStepsService.remove(id);
  }
}
