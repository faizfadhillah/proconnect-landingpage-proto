// src\user_SalaryCountry\user_SalaryCountry.controller.ts
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
import { UserSalaryCountryService } from "./user_salary_country.service";
import { CreateUserSalaryCountryDto } from "./dto/create-user_salary_country.dto";
import { UpdateUserSalaryCountryDto } from "./dto/update-user_salary_country.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserSalaryCountry } from "./entities/user_salary_country.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";

@Controller("user-salary-country")
@ApiTags("user-salary-country")
@ApiBearerAuth()
export class UserSalaryCountryController {
  constructor(
    private readonly userSalaryCountryService: UserSalaryCountryService,
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
    example: { salary_country_id: "" },
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
    type: BasePagination<UserSalaryCountry>,
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
    return this.fieldsService.search(UserSalaryCountry, {
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
    summary: "Create a new UserSalaryCountry",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The UserSalaryCountry has been successfully created.",
    type: UserSalaryCountry,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createUserSalaryCountryDto: CreateUserSalaryCountryDto) {
    return this.userSalaryCountryService.create(createUserSalaryCountryDto);
  }

  /*
  @Get()
  
  @ApiOperation({ summary: 'Get all UserSalaryCountry', operationId: 'findAll'})
  @ApiResponse({ status: 200, description: 'Returns the list of all UserSalaryCountry.', type: [UserSalaryCountry] })
  findAll() {
    return this.userSalaryCountryService.findAll();
  }

  @Get(':id')
  
  @ApiOperation({ summary: 'Get a UserSalaryCountry by ID', operationId: 'findOne' })
  @ApiResponse({ status: 200, description: 'Returns the UserSalaryCountry with the specified ID.', type: UserSalaryCountry })
  @ApiResponse({ status: 404, description: 'UserSalaryCountry not found.' })
  findOne(@Param('id') id: string) {
    return this.userSalaryCountryService.findOne(id);
  }
  */

  @Patch(":id")
  @ApiOperation({
    summary: "Update a UserSalaryCountry by ID",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The UserSalaryCountry has been successfully updated.",
    type: UserSalaryCountry,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "UserSalaryCountry not found." })
  update(
    @Param("id") id: string,
    @Body() updateUserSalaryCountryDto: UpdateUserSalaryCountryDto,
  ) {
    return this.userSalaryCountryService.update(id, updateUserSalaryCountryDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a UserSalaryCountry by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The UserSalaryCountry has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "UserSalaryCountry not found." })
  remove(@Param("id") id: string) {
    return this.userSalaryCountryService.remove(id);
  }
}
