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
import { UserRightToWorkService } from "./user-right-to-work.service";
import { CreateUserRightToWorkDto } from "./dto/create-user-right-to-work.dto";
import { UpdateUserRightToWorkDto } from "./dto/update-user-right-to-work.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserRightToWork } from "./entities/user-right-to-work.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";

@Controller("user-right-to-works")
@ApiTags("user-right-to-works")
@ApiBearerAuth()
export class UserRightToWorkController {
  constructor(
    private readonly userRightToWorkService: UserRightToWorkService,
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
    example: { right_to_work_id: "", status: "" },
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
    type: BasePagination<UserRightToWork>,
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
    return this.fieldsService.search(UserRightToWork, {
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
    summary: "Create a new user right to work",
    operationId: "create",
  })
  create(@Body() createUserRightToWorkDto: CreateUserRightToWorkDto) {
    return this.userRightToWorkService.create(createUserRightToWorkDto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all user right to works",
    operationId: "findAll",
  })
  findAll() {
    return this.userRightToWorkService.findAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a user right to work by ID",
    operationId: "findOne",
  })
  findOne(@Param("id") id: string) {
    return this.userRightToWorkService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a user right to work by ID",
    operationId: "update",
  })
  update(
    @Param("id") id: string,
    @Body() updateUserRightToWorkDto: UpdateUserRightToWorkDto,
  ) {
    return this.userRightToWorkService.update(id, updateUserRightToWorkDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a user right to work by ID",
    operationId: "remove",
  })
  remove(@Param("id") id: string) {
    return this.userRightToWorkService.remove(id);
  }
}
