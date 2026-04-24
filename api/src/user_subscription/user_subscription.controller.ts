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
import { UserSubscriptionService } from "./user_subscription.service";
import { CreateUserSubscriptionDto } from "./dto/create-user_subscription.dto";
import { UpdateUserSubscriptionDto } from "./dto/update-user_subscription.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserSubscription } from "./entities/user_subscription.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";

@Controller("user-subscription")
@ApiTags("user-subscription")
@ApiBearerAuth()
export class UserSubscriptionController {
  constructor(
    private readonly userSubscriptionService: UserSubscriptionService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Get("search")
  @ApiOperation({ summary: "Search with filters", operationId: "search" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({
    name: "filters",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic filters for searching",
    example: { subription_id: "" },
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "expands", required: false })
  @ApiQuery({
    name: "sortBy",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic sorting",
    example: {
      subcription_id: "ASC",
    },
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of users matching the search criteria.",
    type: BasePagination<UserSubscription>,
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
    return this.fieldsService.search(UserSubscription, {
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

  @Get(":id")
  @ApiOperation({
    summary: "Get a UserSubscription by ID",
    operationId: "findOne",
  })
  findOne(@Param("id") id: string) {
    return this.userSubscriptionService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: "Create a new UserSubscription",
    operationId: "create",
  })
  create(@Body() createUserSubscriptionDto: CreateUserSubscriptionDto) {
    return this.userSubscriptionService.create(createUserSubscriptionDto);
  }

  @Get()
  @ApiOperation({
    summary: "Get all UserSubscriptions",
    operationId: "findAll",
  })
  findAll() {
    return this.userSubscriptionService.findAll();
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a UserSubscription by ID",
    operationId: "update",
  })
  update(
    @Param("id") id: string,
    @Body() updateUserSubscriptionDto: UpdateUserSubscriptionDto,
  ) {
    return this.userSubscriptionService.update(id, updateUserSubscriptionDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a UserSubscription by ID",
    operationId: "remove",
  })
  remove(@Param("id") id: string) {
    return this.userSubscriptionService.remove(id);
  }
}
