// src\user_files\user_files.controller.ts
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
import { UserFilesService } from "./user_files.service";
import { CreateUserFileDto } from "./dto/create-user_file.dto";
import { UpdateUserFileDto } from "./dto/update-user_file.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { UserFile } from "./entities/user_file.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";

@Controller("user-files")
@ApiTags("user-files")
@ApiBearerAuth()
export class UserFilesController {
  constructor(
    private readonly UserFileService: UserFilesService,
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
    example: { file_name: "", file_type: "" },
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
    type: BasePagination<UserFile>,
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
    return this.fieldsService.search(UserFile, {
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
  @ApiOperation({ summary: "Create a new UserFile", operationId: "create" })
  @ApiResponse({
    status: 201,
    description: "The UserFile has been successfully created.",
    type: UserFile,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createUserFileDto: CreateUserFileDto) {
    return this.UserFileService.create(createUserFileDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all UserFiles", operationId: "findAll" })
  @ApiResponse({
    status: 200,
    description: "Returns the list of all UserFiles.",
    type: [UserFile],
  })
  findAll() {
    return this.UserFileService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a UserFile by ID", operationId: "findOne" })
  @ApiResponse({
    status: 200,
    description: "Returns the UserFile with the specified ID.",
    type: UserFile,
  })
  @ApiResponse({ status: 404, description: "UserFile not found." })
  findOne(@Param("id") id: string) {
    return this.UserFileService.findOne(id);
  }

  @Get("user_id/:user_id")
  @ApiOperation({
    summary: "Get a UserFile by user_id",
    operationId: "findByUserId",
  })
  @ApiResponse({
    status: 200,
    description:
      "Returns the UserFile(s) associated with the specified user_id.",
    type: [UserFile],
  })
  @ApiResponse({
    status: 404,
    description: "No UserFile found for the specified user_id.",
  })
  findByUserId(@Param("user_id") user_id: string) {
    return this.UserFileService.findByUserId(user_id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a UserFile by ID", operationId: "update" })
  @ApiResponse({
    status: 200,
    description: "The UserFile has been successfully updated.",
    type: UserFile,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "UserFile not found." })
  update(
    @Param("id") id: string,
    @Body() updateUserFileDto: UpdateUserFileDto,
  ) {
    return this.UserFileService.update(id, updateUserFileDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a UserFile by ID", operationId: "remove" })
  @ApiResponse({
    status: 204,
    description: "The UserFile has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "UserFile not found." })
  remove(@Param("id") id: string) {
    return this.UserFileService.remove(id);
  }
}
