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
import { QuestionnaireAnswersService } from "./questionnaire_answers.service";
import { CreateQuestionnaireAnswerDto } from "./dto/create-questionnaire_answer.dto";
import { UpdateQuestionnaireAnswerDto } from "./dto/update-questionnaire_answer.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { QuestionnaireAnswer } from "./entities/questionnaire_answer.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";
import { BulkCreateQuestionnaireAnswerDto } from "./dto/bulk-create-questionnaire_answer.dto";
import { BulkUpdateQuestionnaireAnswerDto } from "./dto/bulk-update-questionnaire_answer.dto";

@Controller("questionnaire-answers")
@ApiTags("questionnaire-answers")
@ApiBearerAuth()
export class QuestionnaireAnswersController {
  constructor(
    private readonly questionnaireAnswerService: QuestionnaireAnswersService,
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
    example: {
      questionnaire_id: "",
      job_step_id: "",
      applicant_step_id: "",
      no: "",
      type: "",
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
    type: BasePagination<QuestionnaireAnswer>,
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
    return this.fieldsService.search(QuestionnaireAnswer, {
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

  @Post("bulk")
  @ApiOperation({
    summary: "Create multiple QuestionnaireAnswers in bulk",
    operationId: "bulkCreate",
  })
  @ApiResponse({
    status: 201,
    description: "The QuestionnaireAnswers have been successfully created.",
    type: [QuestionnaireAnswer],
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  bulkCreate(@Body() bulkCreateDto: BulkCreateQuestionnaireAnswerDto) {
    return this.questionnaireAnswerService.bulkCreate(bulkCreateDto);
  }

  @Post()
  @ApiOperation({
    summary: "Create a new QuestionnaireAnswer",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The QuestionnaireAnswer has been successfully created.",
    type: QuestionnaireAnswer,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createQuestionnaireAnswerDto: CreateQuestionnaireAnswerDto) {
    return this.questionnaireAnswerService.create(createQuestionnaireAnswerDto);
  }

  @Patch("bulk")
  @ApiOperation({
    summary: "Update multiple QuestionnaireAnswers in bulk",
    operationId: "bulkUpdate",
  })
  @ApiResponse({
    status: 200,
    description: "The QuestionnaireAnswers have been successfully updated.",
    type: [QuestionnaireAnswer],
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({
    status: 404,
    description: "One or more QuestionnaireAnswers not found.",
  })
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdateQuestionnaireAnswerDto) {
    return this.questionnaireAnswerService.bulkUpdate(bulkUpdateDto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a QuestionnaireAnswer",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The QuestionnaireAnswer has been successfully updated.",
    type: QuestionnaireAnswer,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  update(
    @Param("id") id: string,
    @Body() updateQuestionnaireAnswerDto: UpdateQuestionnaireAnswerDto,
  ) {
    return this.questionnaireAnswerService.update(
      id,
      updateQuestionnaireAnswerDto,
    );
  }

  @Get("searchn")
  @ApiOperation({
    summary: "Search QuestionnaireAnswers with filters",
    operationId: "search",
  })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "questionnaireId", required: false })
  @ApiQuery({ name: "jobStepId", required: false })
  @ApiQuery({ name: "applicantStepId", required: false })
  @ApiQuery({ name: "no", required: false, type: Number })
  @ApiQuery({ name: "type", required: false })
  @ApiQuery({ name: "question", required: false })
  @ApiQuery({ name: "options", required: false })
  @ApiQuery({ name: "value", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description:
      "Returns the list of QuestionnaireAnswers matching the search criteria.",
    type: BasePagination<QuestionnaireAnswer>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  async searchn(
    @Query("id") id?: string,
    @Query("questionnaireId") questionnaireId?: string,
    @Query("jobStepId") jobStepId?: string,
    @Query("applicantStepId") applicantStepId?: string,
    @Query("no") no?: number,
    @Query("type") type?: string,
    @Query("question") question?: string,
    @Query("options") options?: string,
    @Query("value") value?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.questionnaireAnswerService.search({
      id,
      questionnaireId,
      jobStepId,
      applicantStepId,
      no,
      type,
      question,
      options,
      value,
      page,
      limit,
    });
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a QuestionnaireAnswer by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The QuestionnaireAnswer has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "QuestionnaireAnswer not found." })
  remove(@Param("id") id: string) {
    return this.questionnaireAnswerService.remove(id);
  }
}
