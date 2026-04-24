// src\user_career_history\user_career_history.controller.ts
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
import { UserCareerHistoryService } from "./user_career_history.service";
import { CreateUserCareerHistoryDto } from "./dto/create-user_career_history.dto";
import { UpdateUserCareerHistoryDto } from "./dto/update-user_career_history.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserCareerHistory } from "./entities/user_career_history.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";

@Controller("user-career-history")
@ApiTags("user-career-history")
@ApiBearerAuth()
export class UserCareerHistoryController {
  constructor(
    private readonly userCareerHistoryService: UserCareerHistoryService,
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
    example: { company_name: "", job_title: "" },
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
    type: BasePagination<UserCareerHistory>,
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
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);
    return this.fieldsService.search(UserCareerHistory, {
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
    summary: "Create a new UserCareerHistory",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The UserCareerHistory has been successfully created.",
    type: UserCareerHistory,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createUserCareerHistoryDto: CreateUserCareerHistoryDto) {
    return this.userCareerHistoryService.create(createUserCareerHistoryDto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a UserCareerHistory",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The UserCareerHistory has been successfully updated.",
    type: UserCareerHistory,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "UserCareerHistory not found." })
  update(
    @Param("id") id: string,
    @Body() updateUserCareerHistoryDto: UpdateUserCareerHistoryDto,
  ) {
    return this.userCareerHistoryService.update(id, updateUserCareerHistoryDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a UserCareerHistory",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The UserCareerHistory has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "UserCareerHistory not found." })
  remove(@Param("id") id: string) {
    return this.userCareerHistoryService.remove(id);
  }
}
