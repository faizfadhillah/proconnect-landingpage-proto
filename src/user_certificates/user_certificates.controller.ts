// src\user_certificates\user_certificates.controller.ts
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
  Request,
} from "@nestjs/common";
import { UserCertificatesService } from "./user_certificates.service";
import { CreateUserCertificateDto } from "./dto/create-user_certificates.dto";
import { UpdateUserCertificateDto } from "./dto/update-user_certificates.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserCertificate } from "./entities/user_certificates.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";

@Controller("user-certificates")
@ApiTags("user-certificates")
@ApiBearerAuth()
export class UserCertificatesController {
  constructor(
    private readonly userCertificatesService: UserCertificatesService,
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
    example: { user_id: "" },
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
    type: BasePagination<UserCertificate>,
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
    return this.fieldsService.search(UserCertificate, {
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
    summary: "Create a new UserCertificate",
    operationId: "create",
    description: "Create a new user certificate.",
  })
  @ApiResponse({
    status: 201,
    description: "The UserCertificate has been successfully created.",
    type: UserCertificate,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "Master license not found." })
  create(
    @Request() req,
    @Body() createUserCertificateDto: CreateUserCertificateDto,
  ) {
    // Set user_id from DTO if provided, otherwise use authenticated user's ID
    if (!createUserCertificateDto.user_id) {
      createUserCertificateDto.user_id = req.user.id;
    }
    return this.userCertificatesService.create(createUserCertificateDto);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a UserCertificate by ID",
    operationId: "findOne",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the UserCertificate.",
    type: UserCertificate,
  })
  @ApiResponse({ status: 404, description: "UserCertificate not found." })
  findOne(@Param("id") id: string) {
    return this.userCertificatesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a UserCertificate",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The UserCertificate has been successfully updated.",
    type: UserCertificate,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "UserCertificate not found." })
  update(
    @Param("id") id: string,
    @Body() updateUserCertificateDto: UpdateUserCertificateDto,
  ) {
    return this.userCertificatesService.update(id, updateUserCertificateDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a UserCertificate",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The UserCertificate has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "UserCertificate not found." })
  remove(@Param("id") id: string) {
    return this.userCertificatesService.remove(id);
  }
}
