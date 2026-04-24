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
  Request,
  Res,
} from "@nestjs/common";
import { UserSkillPassportsService } from "./user_skill_passports.service";
import { CreateUserSkillPassportDto } from "./dto/create-user_skill_passport.dto";
import { UpdateUserSkillPassportDto } from "./dto/update-user_skill_passport.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserSkillPassport } from "./entities/user_skill_passport.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";
import { User } from "src/users/entities/user.entity";

@Controller("user-skill-passports")
@ApiTags("user-skill-passports")
@ApiBearerAuth()
export class UserSkillPassportsController {
  constructor(
    private readonly userSkillPassportsService: UserSkillPassportsService,
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
    example: { user_id: "", number: "" },
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "expands", required: false })
  @ApiQuery({ name: "isExcel", required: false })
  @ApiQuery({
    name: "sortBy",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic sorting",
    example: {
      number: "ASC",
    },
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of users matching the search criteria.",
    type: BasePagination<UserSkillPassport>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Request() req,
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
    const user: User = req.user;
    return this.fieldsService.search(UserSkillPassport, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      isExcel,
      res,
      user,
    });
  }

  @Post()
  @ApiOperation({
    summary: "Create a new UserSkillPassport",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The UserSkillPassport has been successfully created.",
    type: UserSkillPassport,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createUserSkillPassportDto: CreateUserSkillPassportDto) {
    return this.userSkillPassportsService.create(createUserSkillPassportDto);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a UserSkillPassport by ID",
    operationId: "findOne",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the UserSkillPassport.",
    type: UserSkillPassport,
  })
  @ApiResponse({ status: 404, description: "UserSkillPassport not found." })
  findOne(@Param("id") id: string) {
    return this.userSkillPassportsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a UserSkillPassport",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The UserSkillPassport has been successfully updated.",
    type: UserSkillPassport,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "UserSkillPassport not found." })
  update(
    @Param("id") id: string,
    @Body() updateUserSkillPassportDto: UpdateUserSkillPassportDto,
  ) {
    return this.userSkillPassportsService.update(
      id,
      updateUserSkillPassportDto,
    );
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a UserSkillPassport",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The UserSkillPassport has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "UserSkillPassport not found." })
  remove(@Param("id") id: string) {
    return this.userSkillPassportsService.remove(id);
  }
}
