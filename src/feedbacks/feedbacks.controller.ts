import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
  Res,
} from "@nestjs/common";
import { FeedbacksService } from "./feedbacks.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { UpdateFeedbackDto } from "./dto/update-feedback.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { FieldsService } from "src/zfields/fields.service";
import { Feedback } from "./entities/feedback.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";
import { User } from "src/users/entities/user.entity";
import { Public } from "src/auth/public.decorator";

@Controller("feedbacks")
@ApiTags("feedbacks")
@ApiBearerAuth()
export class FeedbacksController {
  constructor(
    private readonly feedbacksService: FeedbacksService,
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
    example: { content: "", post_type: "" },
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
    type: BasePagination<Feedback>,
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
    @Res() res?: Response,
  ) {
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);
    const user: User = req.user;
    return this.fieldsService.search(Feedback, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      isExcel,
      res,
      user,
    });
  }

  @Post()
  @Public()
  @ApiOperation({ summary: "Create a new post", operationId: "create" })
  create(@Body() createFeedbackDto: CreateFeedbackDto) {
    return this.feedbacksService.create(createFeedbackDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all feedbacks", operationId: "findAll" })
  findAll() {
    return this.feedbacksService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a post by ID", operationId: "findOne" })
  findOne(@Param("id") id: string) {
    return this.feedbacksService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a post by ID", operationId: "update" })
  update(
    @Param("id") id: string,
    @Body() updateFeedbackDto: UpdateFeedbackDto,
  ) {
    return this.feedbacksService.update(id, updateFeedbackDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a post by ID", operationId: "remove" })
  remove(@Param("id") id: string) {
    return this.feedbacksService.remove(id);
  }
}
