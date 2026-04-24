// src\user_educations\user_educations.controller.ts
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
import { UserEducationsService } from "../service/user_educations.service";
import { EducationVerificationService } from "../service/education-verification.service";
import { EducationHelperService } from "../service/education-helper.service";
import { StudentsService } from "../service/students.service";
import { PendingStudentAutoInsertService } from "../service/pending-student-auto-insert.service";
import { CreateUserEducationDto } from "../dto/create-user_education.dto";
import { UpdateUserEducationDto } from "../dto/update-user_education.dto";
import { ApproveUserEducationDto } from "../dto/approve-user_education.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserEducation } from "../entities/user_education.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";
import { GetStudentsFilterDto } from "../dto/get-students-filter.dto";
import { StudentStatusResponseDto } from "../dto/student-status-response.dto";
import { StudentVerificationStatus } from "../enums/student-verification-status.enum";
import { AccountStatus } from "../enums/account-status.enum";
import { FindNeedApprovalQueryDto } from "../dto/find-need-approval-query.dto";
import { GetAvailableMajorsParamDto } from "../dto/get-available-majors-param.dto";
import { PendingStudentVerificationsService } from "../service/pending_student_verifications.service";
import { LoggingService } from "src/logs/logs.service";

@Controller("user-educations")
@ApiTags("user-educations")
@ApiBearerAuth()
export class UserEducationsController {
  constructor(
    private readonly userEducationsService: UserEducationsService,
    private readonly educationVerificationService: EducationVerificationService,
    private readonly educationHelperService: EducationHelperService,
    private readonly studentsService: StudentsService,
    private readonly fieldsService: FieldsService,
    private readonly pendingStudentAutoInsertService: PendingStudentAutoInsertService,
    private readonly pendingStudentVerificationsService: PendingStudentVerificationsService,
    private readonly logger: LoggingService,
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
    example: { intitution_name: "", major: "" },
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
    type: BasePagination<UserEducation>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Query("id") id?: string,
    @Query("filters") filters?: DynamicFiltersDto,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: any,
    @Query("expands") expands?: string,
    @Query("isExcel") isExcel?: string,
    @Res() res?: Response,
  ) {
    // Auto-insert pending student verifications when exporting to Excel
    if (isExcel === "true") {
      // Run in background, don't wait for completion
      this.pendingStudentAutoInsertService.autoInsertAllPendingVerifications().catch((error) => {
        this.logger.error(
          `Failed to auto-insert pending verifications during Excel export: ${error instanceof Error ? error.message : String(error)}`,
          "user-educations",
          error instanceof Error ? error.stack : undefined,
        );
      });
    }

    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);
    return this.fieldsService.search(UserEducation, {
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
    summary: "Create a new UserEducation",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The UserEducation has been successfully created.",
    type: UserEducation,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createUserEducationDto: CreateUserEducationDto) {
    return this.userEducationsService.create(createUserEducationDto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a UserEducation", operationId: "update" })
  @ApiResponse({
    status: 200,
    description: "The UserEducation has been successfully updated.",
    type: UserEducation,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "UserEducation not found." })
  update(
    @Param("id") id: string,
    @Body() updateUserEducationDto: UpdateUserEducationDto,
  ) {
    return this.userEducationsService.update(id, updateUserEducationDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a UserEducation by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The UserEducation has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "UserEducation not found." })
  remove(@Param("id") id: string) {
    return this.userEducationsService.remove(id);
  }

  @Patch(":id/approval")
  @ApiOperation({
    summary: "Approve/reject verification (Admin only)",
    operationId: "approve",
  })
  @ApiResponse({
    status: 200,
    description: "The UserEducation verification status has been updated.",
    type: UserEducation,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "UserEducation not found." })
  approve(
    @Param("id") id: string,
    @Body() dto: ApproveUserEducationDto,
    @Request() req: any,
  ) {
    // Get approval_by from logged-in user's email
    const approvalBy = req.user?.email || req.firebaseUser?.email || 'system';
    return this.educationVerificationService.approve(id, dto.approval_state, approvalBy);
  }

  @Get("need-approval")
  @ApiOperation({
    summary: "Get educations by approval state (Admin only)",
    operationId: "needApproval",
    description: "Get educations filtered by approval state(s). Filters out educations from soft-deleted users.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns paginated list of educations.",
    type: BasePagination<UserEducation>,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  needApproval(@Query() query: FindNeedApprovalQueryDto) {
    return this.userEducationsService.findNeedApproval(
      query.page || 1,
      query.limit,
      query.filters,
    );
  }

  @Get("students")
  @ApiOperation({
    summary: "Get students with verification status and filters",
    operationId: "getStudents",
  })
  @ApiQuery({ name: "school_id", required: false, type: String, description: "Filter by school ID" })
  @ApiQuery({ name: "name", required: false, type: String, description: "Filter by user name (case-insensitive partial match)" })
  @ApiQuery({ name: "email", required: false, type: String, description: "Filter by user email (case-insensitive partial match)" })
  @ApiQuery({ name: "major_id", required: false, type: String, description: "Filter by major ID" })
  @ApiQuery({ name: "verification_status", required: false, enum: StudentVerificationStatus, description: "Filter by verification status" })
  @ApiQuery({ name: "account_status", required: false, enum: AccountStatus, description: "Filter by account status" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Returns paginated list of students with verification status",
    type: BasePagination<StudentStatusResponseDto>,
  })
  @ApiResponse({ status: 400, description: "Bad request - invalid UUID format" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  getStudents(
    @Query() filters: GetStudentsFilterDto,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.studentsService.getStudents(
      filters,
      page || 1,
      limit,
    );
  }

  @Get("get-available-majors/:schoolId")
  @ApiOperation({
    summary: "Get available majors for a school",
    operationId: "getAvailableMajors",
  })
  @ApiResponse({
    status: 200,
    description: "Returns array of available majors for the school",
    type: Array,
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", example: "123e4567-e89b-12d3-a456-426614174001" },
          name: { type: "string", example: "Computer Science" },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad Request - Invalid schoolId format" })
  getAvailableMajors(@Param() params: GetAvailableMajorsParamDto) {
    return this.educationHelperService.getAvailableMajors(params.schoolId);
  }

  @Post("sync-pending-students")
  @ApiOperation({
    summary: "Sync pending student verifications to user educations for current user",
    operationId: "syncPendingStudentsToEducations",
    description: "Syncs pending student data to user educations in database. Handles Case 2 (updates existing) and Case 3 (auto-inserts new). Only updates educations that are not verified. All updates are persisted to database.",
  })
  @ApiResponse({
    status: 200,
    description: "Returns sync result with updated, inserted, and skipped counts",
    schema: {
      example: {
        updated: 2,
        inserted: 1,
        skipped: 1,
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async syncPendingStudentsToEducations(@Request() req: any) {
    const userEmail = req.user?.email || req.firebaseUser?.email;
    const userId = req.user?.id;
    
    if (!userEmail || !userId) {
      return { updated: 0, inserted: 0, skipped: 0 };
    }
    
    return this.pendingStudentVerificationsService.syncPendingStudentsToUserEducations(
      userEmail,
      userId,
    );
  }
}
