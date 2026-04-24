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
import { FollowUserToUserService } from "./follow_user_to_user.service";
import { CreateFollowUserToUserDto } from "./dto/create-follow_user_to_user.dto";
import { UpdateFollowUserToUserDto } from "./dto/update-follow_user_to_user.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import {
  FollowUserToUser,
} from "./entities/follow_user_to_user.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";

@Controller("follow-user-to-user")
@ApiTags("follow-user-to-user")
@ApiBearerAuth()
export class FollowUserToUserController {
  constructor(
    private readonly followUserToUserService: FollowUserToUserService,
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
    example: { follower_id: "", followed_id: "" },
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
    type: BasePagination<FollowUserToUser>,
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
    return this.fieldsService.search(FollowUserToUser, {
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
    summary: "Create a new FollowUserToUser",
    operationId: "create",
  })
  create(@Body() createFollowUserToUserDto: CreateFollowUserToUserDto) {
    return this.followUserToUserService.create(createFollowUserToUserDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all FollowUserToUser", operationId: "findAll" })
  findAll() {
    return this.followUserToUserService.findAll();
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a FollowUserToUser by ID",
    operationId: "findOne",
  })
  findOne(@Param("id") id: string) {
    return this.followUserToUserService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a FollowUserToUser by ID",
    operationId: "update",
  })
  update(
    @Param("id") id: string,
    @Body() updateFollowUserToUserDto: UpdateFollowUserToUserDto,
  ) {
    return this.followUserToUserService.update(id, updateFollowUserToUserDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a FollowUserToUser by ID",
    operationId: "remove",
  })
  remove(@Param("id") id: string) {
    return this.followUserToUserService.remove(id);
  }
}
