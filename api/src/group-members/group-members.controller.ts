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
import { GroupMembersService } from "./group-members.service";
import { CreateGroupMembersDto } from "./dto/create-group-members.dto";
import { UpdateGroupMembersDto } from "./dto/update-group-members.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { GroupMembers } from "./entities/group-members.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";

@Controller("group-members")
@ApiTags("group-members")
@ApiBearerAuth()
export class GroupMembersController {
  constructor(
    private readonly groupMembersService: GroupMembersService,
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
    example: { group_id: "", user_id: "" },
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
    type: BasePagination<GroupMembers>,
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
    return this.fieldsService.search(GroupMembers, {
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
  @ApiOperation({ summary: "Create a new Group Member", operationId: "create" })
  create(@Body() createGroupMembersDto: CreateGroupMembersDto) {
    return this.groupMembersService.create(createGroupMembersDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all Group Members", operationId: "findAll" })
  findAll() {
    return this.groupMembersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a Group Member by ID", operationId: "findOne" })
  findOne(@Param("id") id: string) {
    return this.groupMembersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a Group Member by ID",
    operationId: "update",
  })
  update(
    @Param("id") id: string,
    @Body() updateGroupMembersDto: UpdateGroupMembersDto,
  ) {
    return this.groupMembersService.update(id, updateGroupMembersDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a Group Member by ID",
    operationId: "remove",
  })
  remove(@Param("id") id: string) {
    return this.groupMembersService.remove(id);
  }
}
