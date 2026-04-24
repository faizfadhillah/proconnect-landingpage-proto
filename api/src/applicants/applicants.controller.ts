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
import { ApplicantsService } from "./applicants.service";
import { CreateApplicantDto } from "./dto/create-applicant.dto";
import { UpdateApplicantDto } from "./dto/update-applicant.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { Applicant } from "./entities/applicant.entity";
import { ApplicantResponseDto } from "./dto/applicant-response.dto";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";
import { UserWithRoles } from "src/users/interfaces/user-with-roles.interface";

@Controller("applicants")
@ApiTags("applicants")
@ApiBearerAuth()
export class ApplicantsController {
  constructor(
    private readonly applicantsService: ApplicantsService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Get("search")
  @ApiOperation({ summary: "Search with filters", operationId: "search" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "age_start", required: false, type: Number })
  @ApiQuery({ name: "age_end", required: false, type: Number })
  @ApiQuery({
    name: "expands",
    required: false,
    example: "user.userProfessions,job.company",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "filters",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic filters for searching",
    example: {
      user_id: "",
      status: "",
      "user.userProfessions.profession_id":
        "d0af7ec9-bd6b-4d0b-bd06-a39127583fe1",
    },
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
    type: BasePagination<Applicant>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Request() req,
    @Query("id") id?: string,
    @Query("age_start") age_start?: number,
    @Query("age_end") age_end?: number,
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
    const user: UserWithRoles = req?.user;

    if (expands && expands.includes("applicantJobSteps")) {
      //await this.applicantsService.refreshApplicantJobStep(parsedFilters);
    }

    const result = await this.fieldsService.search(Applicant, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      options: {
        age_start,
        age_end,
      },
      isExcel
    });

    // Enrich applicants with skill match (PoV Employer)
    // Convert entities to DTOs with skill_match
    if (result.items && result.items.length > 0) {
      result.items = await this.applicantsService.enrichApplicantsWithSkillMatch(
        result.items as Applicant[],
      );
    }

    // Send response manually after enrichment
    if (res) {
      res.status(200).json(result);
      res.end();
      return result;
    }

    return result;
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get applicant detail (includes skill_match)",
    operationId: "getApplicantById",
  })
  @ApiResponse({
    status: 200,
    description: "Returns applicant detail with skill_match.",
    type: ApplicantResponseDto,
  })
  @ApiResponse({ status: 404, description: "Applicant not found." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findById(
    @Param("id") id: string,
  ): Promise<ApplicantResponseDto> {
    return this.applicantsService.findOneWithSkillMatch(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new applicant", operationId: "create" })
  create(@Body() createApplicantDto: CreateApplicantDto) {
    return this.applicantsService.create(createApplicantDto);
  }

  @Patch(":jobId/:userId")
  @ApiOperation({ summary: "Update an applicant", operationId: "update" })
  update(
    @Param("jobId") jobId: string,
    @Param("userId") userId: string,
    @Body() updateApplicantDto: UpdateApplicantDto,
  ) {
    return this.applicantsService.update(jobId, userId, updateApplicantDto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an applicant", operationId: "updatebyid" })
  updateByID(
    @Param("id") id: string,
    @Body() updateApplicantDto: UpdateApplicantDto,
  ) {
    return this.applicantsService.updateByID(id, updateApplicantDto);
  }

  @Delete(":jobId/:userId")
  @ApiOperation({ summary: "Delete an applicant", operationId: "remove" })
  remove(@Param("jobId") jobId: string, @Param("userId") userId: string) {
    return this.applicantsService.remove(jobId, userId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an applicant", operationId: "removebyid" })
  removeByID(@Param("id") id: string) {
    return this.applicantsService.removeByID(id);
  }
}
