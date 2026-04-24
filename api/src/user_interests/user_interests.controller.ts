// src\user_Interests\user_Interests.controller.ts
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
import { UserInterestsService } from "./user_interests.service";
import { CreateUserInterestDto } from "./dto/create-user_interest.dto";
import { UpdateUserInterestDto } from "./dto/update-user_interest.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserInterest } from "./entities/user_interest.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";

@Controller("user-interests")
@ApiTags("user-interests")
@ApiBearerAuth()
export class UserInterestsController {
  constructor(
    private readonly userInterestsService: UserInterestsService,
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
    example: { user_id: "", interest_id: "" },
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
    type: BasePagination<UserInterest>,
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
    return this.fieldsService.search(
      UserInterest,

      {
        id,
        filters: parsedFilters,
        page,
        limit,
        sortBy: parsedSortBy,
        expands,
        isExcel,
        res,
      },
    );
  }

  @Post()
  @ApiOperation({ summary: "Create a new UserInterest", operationId: "create" })
  @ApiResponse({
    status: 201,
    description: "The UserInterest has been successfully created.",
    type: UserInterest,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createUserInterestDto: CreateUserInterestDto) {
    return this.userInterestsService.create(createUserInterestDto);
  }

  /*
  @Get()
  
  @ApiOperation({ summary: 'Get all UserInterests', operationId: 'findAll'})
  @ApiResponse({ status: 200, description: 'Returns the list of all UserInterests.', type: [UserInterest] })
  findAll() {
    return this.userInterestsService.findAll();
  }

  @Get(':id')
  
  @ApiOperation({ summary: 'Get a UserInterest by ID', operationId: 'findOne' })
  @ApiResponse({ status: 200, description: 'Returns the UserInterest with the specified ID.', type: UserInterest })
  @ApiResponse({ status: 404, description: 'UserInterest not found.' })
  findOne(@Param('id') id: string) {
    return this.userInterestsService.findOne(id);
  }
  */

  @Patch(":id")
  @ApiOperation({
    summary: "Update a UserInterest by ID",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The UserInterest has been successfully updated.",
    type: UserInterest,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "UserInterest not found." })
  update(
    @Param("id") id: string,
    @Body() updateUserInterestDto: UpdateUserInterestDto,
  ) {
    return this.userInterestsService.update(id, updateUserInterestDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a UserInterest by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The UserInterest has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "UserInterest not found." })
  remove(@Param("id") id: string) {
    return this.userInterestsService.remove(id);
  }
}
