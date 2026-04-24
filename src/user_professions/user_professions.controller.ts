// src\user_professions\user_professions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Res,
} from "@nestjs/common";
import { UserProfessionsService } from "./user_professions.service";
import { CreateUserProfessionDto } from "./dto/create-user_profession.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserProfession } from "./entities/user_profession.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";

@Controller("user-professions")
@ApiTags("user-professions")
@ApiBearerAuth()
export class UserProfessionsController {
  constructor(
    private readonly userProfessionsService: UserProfessionsService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Get("search")
  @ApiOperation({ summary: "Search with filters", operationId: "search" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "expands", required: false })
  @ApiQuery({
    name: "filters",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic filters for searching",
    example: { user_id: "", profession_id: "" },
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
    type: BasePagination<UserProfession>,
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
    return this.fieldsService.search(UserProfession, {
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
    summary: "Create a new UserProfession",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The UserProfession has been successfully created.",
    type: UserProfession,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createUserProfessionDto: CreateUserProfessionDto) {
    return this.userProfessionsService.create(createUserProfessionDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a UserProfession by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The UserProfession has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "UserProfession not found." })
  remove(@Param("id") id: string) {
    return this.userProfessionsService.remove(id);
  }
}
