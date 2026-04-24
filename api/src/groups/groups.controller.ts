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
import { GroupsService } from "./groups.service";
import { CreateGroupsDto } from "./dto/create-groups.dto";
import { UpdateGroupsDto } from "./dto/update-groups.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Groups } from "./entities/groups.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";

@Controller("groups")
@ApiTags("groups")
@ApiBearerAuth()
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
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
    example: { name: "" },
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
    type: BasePagination<Groups>,
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
    return this.fieldsService.search(Groups, {
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
  @ApiOperation({ summary: "Create a new Group", operationId: "create" })
  create(@Body() createGroupsDto: CreateGroupsDto) {
    return this.groupsService.create(createGroupsDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all Groups", operationId: "findAll" })
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a Group by ID", operationId: "findOne" })
  findOne(@Param("id") id: string) {
    return this.groupsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a Group by ID", operationId: "update" })
  update(@Param("id") id: string, @Body() updateGroupsDto: UpdateGroupsDto) {
    return this.groupsService.update(id, updateGroupsDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a Group by ID", operationId: "remove" })
  remove(@Param("id") id: string) {
    return this.groupsService.remove(id);
  }
}
