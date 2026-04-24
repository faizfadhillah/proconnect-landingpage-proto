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
import { ConfigsService } from "./config.service";
import { CreateConfigDto } from "./dto/create-config.dto";
import { UpdateConfigDto } from "./dto/update-config.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from "@nestjs/swagger";
import { Config } from "./entities/config.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";
import { Public } from "src/auth/public.decorator";

@Controller("configs")
@ApiTags("configs")
@ApiBearerAuth()
export class ConfigsController {
  constructor(
    private readonly configService: ConfigsService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Get("search")
  @Public()
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
    example: { key: "" },
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
    type: BasePagination<Config>,
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
    return this.fieldsService.search(Config, {
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
  @ApiOperation({ summary: "Create a new config", operationId: "create" })
  @ApiResponse({
    status: 201,
    description: "The config has been successfully created.",
    type: Config,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createConfigDto: CreateConfigDto) {
    return this.configService.create(createConfigDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all configs", operationId: "findAll" })
  @ApiResponse({
    status: 200,
    description: "Returns the list of configs.",
    type: [Config],
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  findAll() {
    return this.configService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a config by ID", operationId: "findOne" })
  @ApiResponse({
    status: 200,
    description: "Returns the config with the specified ID.",
    type: Config,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  findOne(@Param("id") id: string) {
    return this.configService.findOne(id);
  }

  @Get("key/:key")
  @ApiOperation({ summary: "Get a config by key", operationId: "findByKey" })
  @Public()
  @ApiResponse({
    status: 200,
    description: "Returns the config with the specified key.",
    type: Config,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  findByKey(@Param("key") key: string) {
    return this.configService.findByKey(key);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a config by ID", operationId: "update" })
  @ApiResponse({
    status: 200,
    description: "The config has been successfully updated.",
    type: Config,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "Config not found." })
  update(@Param("id") id: string, @Body() updateConfigDto: UpdateConfigDto) {
    return this.configService.update(id, updateConfigDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a config by ID", operationId: "remove" })
  @ApiResponse({
    status: 204,
    description: "The config has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "Config not found." })
  remove(@Param("id") id: string) {
    return this.configService.remove(id);
  }
}
