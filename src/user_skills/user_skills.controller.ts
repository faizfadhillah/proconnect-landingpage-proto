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
import { UserSkillsService } from "./user_skills.service";
import { CreateUserSkillDto } from "./dto/create-user_skill.dto";
import { UpdateUserSkillDto } from "./dto/update-user_skill.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserSkill } from "./entities/user_skill.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";

@Controller("user-skills")
@ApiTags("user-skills")
@ApiBearerAuth()
export class UserSkillsController {
  constructor(
    private readonly userSkillsService: UserSkillsService,
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
    example: { user_id: "", skill_id: "" },
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
      user_id: "ASC",
      skill: "DESC",
    },
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of users matching the search criteria.",
    type: BasePagination<UserSkill>,
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
    return this.fieldsService.search(UserSkill, {
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
  @ApiOperation({ summary: "Create a new UserSkill", operationId: "create" })
  @ApiResponse({
    status: 201,
    description: "The UserSkill has been successfully created.",
    type: UserSkill,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createUserSkillDto: CreateUserSkillDto) {
    return this.userSkillsService.create(createUserSkillDto);
  }

  /*
  @Get()
  
  @ApiOperation({ summary: 'Get all UserSkills', operationId: 'findAll'})
  @ApiResponse({ status: 200, description: 'Returns the list of all UserSkills.', type: [UserSkill] })
  findAll() {
    return this.userSkillsService.findAll();
  }

  @Get(':id')
  
  @ApiOperation({ summary: 'Get a UserSkill by ID', operationId: 'findOne' })
  @ApiResponse({ status: 200, description: 'Returns the UserSkill with the specified ID.', type: UserSkill })
  @ApiResponse({ status: 404, description: 'UserSkill not found.' })
  findOne(@Param('id') id: string) {
    return this.userSkillsService.findOne(id);
  }
  */

  @Patch(":id")
  @ApiOperation({ summary: "Update a UserSkill by ID", operationId: "update" })
  @ApiResponse({
    status: 200,
    description: "The UserSkill has been successfully updated.",
    type: UserSkill,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "UserSkill not found." })
  update(
    @Param("id") id: string,
    @Body() updateUserSkillDto: UpdateUserSkillDto,
  ) {
    return this.userSkillsService.update(id, updateUserSkillDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a UserSkill by ID", operationId: "remove" })
  @ApiResponse({
    status: 204,
    description: "The UserSkill has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "UserSkill not found." })
  remove(@Param("id") id: string) {
    return this.userSkillsService.remove(id);
  }
}
