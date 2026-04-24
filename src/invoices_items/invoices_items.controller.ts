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
import { InvoicesItemsService } from "./invoices_items.service";
import { CreateInvoicesItemDto } from "./dto/create-invoices_item.dto";
import { UpdateInvoicesItemDto } from "./dto/update-invoices_item.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import {
  InvoicesItem,
} from "./entities/invoices_item.entity";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";

@Controller("invoices-items")
@ApiTags("invoices-items")
@ApiBearerAuth()
export class InvoicesItemsController {
  constructor(
    private readonly InvoicesItemsService: InvoicesItemsService,
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
    example: { invoice_id: "", paket_id: "" },
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
    type: BasePagination<InvoicesItem>,
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
    return this.fieldsService.search(InvoicesItem, {
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
  @ApiOperation({ summary: "Create a new InvoicesItem", operationId: "create" })
  create(@Body() createInvoicesItemDto: CreateInvoicesItemDto) {
    return this.InvoicesItemsService.create(createInvoicesItemDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all InvoicesItems", operationId: "findAll" })
  findAll() {
    return this.InvoicesItemsService.findAll();
  }

  @Get(":invoice_id")
  @ApiOperation({
    summary: "Get an InvoicesItem by invoice_id",
    operationId: "findOne",
  })
  findOne(@Param("invoice_id") invoice_id: string) {
    return this.InvoicesItemsService.findOne(invoice_id);
  }

  @Patch(":invoice_id")
  @ApiOperation({
    summary: "Update an InvoicesItem by invoice_id",
    operationId: "update",
  })
  update(
    @Param("invoice_id") invoice_id: string,
    @Body() updateInvoicesItemDto: UpdateInvoicesItemDto,
  ) {
    return this.InvoicesItemsService.update(invoice_id, updateInvoicesItemDto);
  }

  @Delete(":invoice_id")
  @ApiOperation({
    summary: "Delete an InvoicesItem by invoice_id",
    operationId: "remove",
  })
  remove(@Param("invoice_id") invoice_id: string) {
    return this.InvoicesItemsService.remove(invoice_id);
  }
}
