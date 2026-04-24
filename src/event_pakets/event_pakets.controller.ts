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
import { EventPaketsService } from "./event_pakets.service";
import { CreateEventPaketDto } from "./dto/create-event_paket.dto";
import { UpdateEventPaketDto } from "./dto/update-event_paket.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { BasePagination } from "src/base.pagination";
import { EventPaket } from "./entities/event_paket.entity";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";

@Controller("event-pakets")
@ApiTags("event-pakets")
@ApiBearerAuth()
export class EventPaketsController {
  constructor(
    private readonly eventPaketsService: EventPaketsService,
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
    example: { name: "", description: "" },
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
    type: BasePagination<EventPaket>,
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
    return this.fieldsService.search(EventPaket, {
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
  @ApiOperation({ summary: "Create a new EventPaket", operationId: "create" })
  create(@Body() createEventPaketDto: CreateEventPaketDto) {
    return this.eventPaketsService.create(createEventPaketDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all EventPakets", operationId: "findAll" })
  findAll() {
    return this.eventPaketsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an EventPaket by ID", operationId: "findOne" })
  findOne(@Param("id") id: string) {
    return this.eventPaketsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update an EventPaket by ID",
    operationId: "update",
  })
  update(
    @Param("id") id: string,
    @Body() updateEventPaketDto: UpdateEventPaketDto,
  ) {
    return this.eventPaketsService.update(id, updateEventPaketDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete an EventPaket by ID",
    operationId: "remove",
  })
  remove(@Param("id") id: string) {
    return this.eventPaketsService.remove(id);
  }
}
