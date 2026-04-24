// src\user_skills\user_skills.controller.ts
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
import { UserLanguagesService } from "./user_languages.service";
import { CreateUserLanguageDto } from "./dto/create-user_language.dto";
import { UpdateUserLanguageDto } from "./dto/update-user_language.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserLanguage } from "./entities/user_language.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";

@Controller("user-languages")
@ApiTags("user-languages")
@ApiBearerAuth()
export class UserLanguagesController {
  constructor(
    private readonly userLanguagesService: UserLanguagesService,
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
    example: { user_id: "", skill_id: "" },
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
    type: BasePagination<UserLanguage>,
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
    return this.fieldsService.search(UserLanguage, {
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
  @ApiOperation({ summary: "Create a new UserLanguage", operationId: "create" })
  @ApiResponse({
    status: 201,
    description: "The UserLanguage has been successfully created.",
    type: UserLanguage,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createUserSkillDto: CreateUserLanguageDto) {
    return this.userLanguagesService.create(createUserSkillDto);
  }

  /*
  @Get()
  
  @ApiOperation({ summary: 'Get all UserSkills', operationId: 'findAll'})
  @ApiResponse({ status: 200, description: 'Returns the list of all UserSkills.', type: [UserLanguage] })
  findAll() {
    return this.userLanguagesService.findAll();
  }

  @Get(':id')
  
  @ApiOperation({ summary: 'Get a UserLanguage by ID', operationId: 'findOne' })
  @ApiResponse({ status: 200, description: 'Returns the UserLanguage with the specified ID.', type: UserLanguage })
  @ApiResponse({ status: 404, description: 'UserLanguage not found.' })
  findOne(@Param('id') id: string) {
    return this.userLanguagesService.findOne(id);
  }
  */

  @Patch(":id")
  @ApiOperation({
    summary: "Update a UserLanguage by ID",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The UserLanguage has been successfully updated.",
    type: UserLanguage,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "UserLanguage not found." })
  update(
    @Param("id") id: string,
    @Body() updateUserSkillDto: UpdateUserLanguageDto,
  ) {
    return this.userLanguagesService.update(id, updateUserSkillDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a UserLanguage by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The UserLanguage has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "UserLanguage not found." })
  remove(@Param("id") id: string) {
    return this.userLanguagesService.remove(id);
  }
}
