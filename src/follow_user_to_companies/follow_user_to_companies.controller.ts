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
import { FollowUserToCompaniesService } from "./follow_user_to_companies.service";
import { CreateFollowUserToCompaniesDto } from "./dto/create-follow_user_to_companies.dto";
import { UpdateFollowUserToCompaniesDto } from "./dto/update-follow_user_to_companies.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import {
  FollowUserToCompanies,
} from "./entities/follow_user_to_companies.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";

@Controller("follow-user-to-companies")
@ApiTags("follow-user-to-companies")
@ApiBearerAuth()
export class FollowUserToCompaniesController {
  constructor(
    private readonly followUserToCompaniesService: FollowUserToCompaniesService,
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
    example: { user_id: "", company_id: "" },
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
    type: BasePagination<FollowUserToCompanies>,
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
    return this.fieldsService.search(FollowUserToCompanies, {
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
    summary: "Create a new FollowUserToCompanies",
    operationId: "create",
  })
  create(
    @Body() createFollowUserToCompaniesDto: CreateFollowUserToCompaniesDto,
  ) {
    return this.followUserToCompaniesService.create(
      createFollowUserToCompaniesDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: "Get all FollowUserToCompanies",
    operationId: "findAll",
  })
  findAll() {
    return this.followUserToCompaniesService.findAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a FollowUserToCompanies by ID",
    operationId: "findOne",
  })
  findOne(@Param("id") id: string) {
    return this.followUserToCompaniesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a FollowUserToCompanies by ID",
    operationId: "update",
  })
  update(
    @Param("id") id: string,
    @Body() updateFollowUserToCompaniesDto: UpdateFollowUserToCompaniesDto,
  ) {
    return this.followUserToCompaniesService.update(
      id,
      updateFollowUserToCompaniesDto,
    );
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a FollowUserToCompanies by ID",
    operationId: "remove",
  })
  remove(@Param("id") id: string) {
    return this.followUserToCompaniesService.remove(id);
  }
}
