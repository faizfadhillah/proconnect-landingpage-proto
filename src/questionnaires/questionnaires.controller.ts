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
import { QuestionnairesService } from "./questionnaires.service";
import { CreateQuestionnaireDto } from "./dto/create-questionnaire.dto";
import { UpdateQuestionnaireDto } from "./dto/update-questionnaire.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { Questionnaire } from "./entities/questionnaire.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";

@Controller("questionnaires")
@ApiTags("questionnaires")
@ApiBearerAuth()
export class QuestionnairesController {
  constructor(
    private readonly questionnairesService: QuestionnairesService,
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
    example: { job_step_id: "", no: "", type: "", question: "" },
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
    type: BasePagination<Questionnaire>,
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
    return this.fieldsService.search(Questionnaire, {
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
    summary: "Create a new Questionnaire",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The Questionnaire has been successfully created.",
    type: Questionnaire,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createQuestionnaireDto: CreateQuestionnaireDto) {
    return this.questionnairesService.create(createQuestionnaireDto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update an existing Questionnaire",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The Questionnaire has been successfully updated.",
    type: Questionnaire,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  update(
    @Param("id") id: string,
    @Body() updateQuestionnaireDto: UpdateQuestionnaireDto,
  ) {
    return this.questionnairesService.update(id, updateQuestionnaireDto);
  }

  @Get("searchn")
  @ApiOperation({
    summary: "Search Questionnaires with filters",
    operationId: "search",
  })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "jobStepId", required: false })
  @ApiQuery({ name: "no", required: false, type: Number })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "question", required: false })
  @ApiQuery({ name: "options", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description:
      "Returns the list of Questionnaires matching the search criteria.",
    type: BasePagination<Questionnaire>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  async searchn(
    @Query("id") id?: string,
    @Query("jobStepId") jobStepId?: string,
    @Query("no") no?: number,
    @Query("type") type?: string,
    @Query("question") question?: string,
    @Query("options") options?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.questionnairesService.search({
      id,
      jobStepId,
      no,
      type,
      question,
      options,
      page,
      limit,
    });
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a Questionnaire by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The Questionnaire has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "Questionnaire not found." })
  remove(@Param("id") id: string) {
    return this.questionnairesService.remove(id);
  }
}
