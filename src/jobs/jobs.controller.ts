// src\jobs\jobs.controller.ts
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
  ForbiddenException,
} from "@nestjs/common";
import { JobsService } from "./services/jobs.service";
import { JobOpeningScheduleService } from "./services/job-opening-schedule.service";
import { CreateJobDto } from "./dto/create-job.dto";
import { UpdateJobDto } from "./dto/update-job.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { Job, JobStatus } from "./entities/job.entity";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { BasePagination } from "src/base.pagination";
import { Response } from "express";
import { User } from "src/users/entities/user.entity";
import { UserWithRoles } from "src/users/interfaces/user-with-roles.interface";
import { Public } from "src/auth/public.decorator";
import { JobPublicResponseDto } from "./dto/job-public-response.dto";
import { JobResponseDto } from "./dto/job-response.dto";

@Controller("jobs")
@ApiTags("jobs")
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly fieldsService: FieldsService,
    private readonly jobOpeningScheduleService: JobOpeningScheduleService,
  ) { }

  @Public()
  @Get("public")
  @ApiOperation({
    summary: "Get public jobs list by company",
    operationId: "findPublicList",
  })
  @ApiQuery({ name: "company_id", required: true, type: String })
  @ApiQuery({ name: "status", required: false, enum: JobStatus })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Public jobs list.",
    type: BasePagination<JobPublicResponseDto>,
  })
  async findPublicList(
    @Query("company_id") companyId: string,
    @Query("status") status?: JobStatus,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ): Promise<BasePagination<JobPublicResponseDto>> {
    return this.jobsService.findPublicListByCompany(
      companyId,
      status,
      page,
      limit,
    );
  }

  @Get("search")
  @ApiBearerAuth()
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
    example: { company_id: "", title: "" },
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
    name: "isCalculateSkillMatch",
    required: false,
    type: Boolean,
    description: "Calculate skill match for each job (PoV Candidate)",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of users matching the search criteria.",
    type: BasePagination<Job>,
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
    @Query("isApplicantCount") isApplicantCount?: boolean,
    @Query("isCalculateSkillMatch") isCalculateSkillMatch?: boolean,
    @Res() res?: Response,
  ) {
    const user: UserWithRoles = req.user;
    let result;
    if (isApplicantCount) {
      result = await this.jobsService.search(
        id,
        filters,
        page,
        limit,
        sortBy,
        expands,
        isExcel,
        user,
      );
      result.items = await Promise.all(
        result.items.map(async (item) => {
          item.applicant_count = await this.jobsService.getApplicantCount(
            item.id,
          );
          return item;
        }),
      );
    } else {
      result = await this.jobsService.search(
        id,
        filters,
        page,
        limit,
        sortBy,
        expands,
        isExcel,
        user,
      );
    }

    // Enrich jobs with skill match (PoV Candidate)
    // Convert entities to DTOs with skill_match
    if (isCalculateSkillMatch
      && result.items
      && result.items.length > 0
      && user?.id
      && user?.isCandidate) {
      result.items = await this.jobsService.enrichJobsWithSkillMatch(
        result.items as Job[],
        user.id,
      );
    }

    if (result.items?.length) {
      result.items = result.items.map((item: any) =>
        JobResponseDto.formatOpenCloseDates(item),
      );
    }

    res.status(200).json(result);
    return result;
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new job", operationId: "create" })
  create(@Body() createJobDto: CreateJobDto, @Request() req) {
    const user: User = req.user;
    createJobDto.company_id = user.company_id;
    return this.jobsService.create(createJobDto, user);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all jobs", operationId: "findAll" })
  async findAll() {
    const jobs = await this.jobsService.findAll();
    return jobs.map((job) => JobResponseDto.formatOpenCloseDates(job));
  }


  @Public()
  @Get("public/slug/:slug")
  @ApiOperation({ summary: "Get a published job by slug (public, no auth)", operationId: "findOnePublicBySlug" })
  @ApiResponse({ status: 200, description: "Public job view.", type: JobPublicResponseDto })
  @ApiResponse({ status: 404, description: "Job not found or not published." })
  findOnePublicBySlug(@Param("slug") slug: string): Promise<JobPublicResponseDto> {
    return this.jobsService.findOnePublicBySlug(slug);
  }

  @Get("trigger-auto-publish")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Trigger auto-publish (superadmin only)",
    description: "Runs the same logic as the daily cron: publish jobs with open_date <= today 00:00 GMT+7.",
    operationId: "triggerAutoPublish",
  })
  @ApiResponse({ status: 200, description: "Auto-publish run triggered." })
  @ApiResponse({ status: 403, description: "Forbidden. Superadmin only." })
  async triggerAutoPublish(@Request() req: { user?: UserWithRoles }) {
    if (!req.user?.isSysAdmin) {
      throw new ForbiddenException("Superadmin only.");
    }
    await this.jobOpeningScheduleService.runAutoPublish();
    return { message: "Auto-publish triggered." };
  }

  @Get("trigger-auto-close")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Trigger auto-close (superadmin only)",
    description: "Runs the same logic as the daily cron: close jobs with close_date passed (1-day buffer).",
    operationId: "triggerAutoClose",
  })
  @ApiResponse({ status: 200, description: "Auto-close run triggered." })
  @ApiResponse({ status: 403, description: "Forbidden. Superadmin only." })
  async triggerAutoClose(@Request() req: { user?: UserWithRoles }) {
    if (!req.user?.isSysAdmin) {
      throw new ForbiddenException("Superadmin only.");
    }
    await this.jobOpeningScheduleService.runAutoClose();
    return { message: "Auto-close triggered." };
  }

  @Get(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a job by ID", operationId: "findOne" })
  findOne(@Param("id") id: string, @Request() req) {
    const user: User = req.user;
    return this.jobsService.findOne(id, user);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a job by ID", operationId: "update" })
  update(@Param("id") id: string, @Body() updateJobDto: UpdateJobDto, @Request() req) {
    const user: User = req.user;
    return this.jobsService.update(id, updateJobDto, user);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete a job by ID", operationId: "remove" })
  remove(@Param("id") id: string, @Request() req) {
    const user: User = req.user;
    return this.jobsService.remove(id, user);
  }
}
