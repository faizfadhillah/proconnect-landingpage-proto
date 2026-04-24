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
import { MstSchoolMajorsService } from "./mst_school_majors.service";
import { CreateMstSchoolMajorDto } from "./dto/create-mst_school_major.dto";
import { UpdateMstSchoolMajorDto } from "./dto/update-mst_school_major.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MstSchoolMajor } from "./entities/mst_school_major.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";

@Controller("mst-school-majors")
@ApiTags("mst-school-majors")
@ApiBearerAuth()
export class MstSchoolMajorsController {
  constructor(
    private readonly mstSchoolMajorsService: MstSchoolMajorsService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Create a new school-major relation",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The school-major relation has been successfully created.",
    type: MstSchoolMajor,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "School or Major not found." })
  @ApiResponse({ status: 409, description: "School-Major relation already exists." })
  create(@Body() createMstSchoolMajorDto: CreateMstSchoolMajorDto) {
    return this.mstSchoolMajorsService.create(createMstSchoolMajorDto);
  }

  @Get("search")
  @ApiOperation({ summary: "Search with filters", operationId: "search" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "expands", required: false })
  @ApiQuery({
    name: "filters",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic filters for searching",
    example: { school_id: "", major_id: "" },
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
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
  @ApiResponse({
    status: 200,
    description: "Returns the list of school-major relations matching the search criteria.",
    type: BasePagination<MstSchoolMajor>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Query("id") id?: string,
    @Query("expands") expands?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("filters") filters?: DynamicFiltersDto,
    @Query("sortBy") sortBy?: any,
    @Query("isExcel") isExcel?: string,
    @Res() res?: Response,
  ) {
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);
    return this.fieldsService.search(MstSchoolMajor, {
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

  @Get("by-school/:schoolId")
  @ApiOperation({
    summary: "Get all majors for a school",
    operationId: "findBySchool",
  })
  @ApiResponse({
    status: 200,
    description: "Returns all majors for the specified school.",
    type: [MstSchoolMajor],
  })
  @ApiResponse({ status: 404, description: "School not found." })
  findBySchool(@Param("schoolId") schoolId: string) {
    return this.mstSchoolMajorsService.findBySchool(schoolId);
  }

  @Get("by-major/:majorId")
  @ApiOperation({
    summary: "Get all schools offering a major",
    operationId: "findByMajor",
  })
  @ApiResponse({
    status: 200,
    description: "Returns all schools offering the specified major.",
    type: [MstSchoolMajor],
  })
  @ApiResponse({ status: 404, description: "Major not found." })
  findByMajor(@Param("majorId") majorId: string) {
    return this.mstSchoolMajorsService.findByMajor(majorId);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get a school-major relation by ID",
    operationId: "findOne",
  })
  @ApiResponse({
    status: 200,
    description: "Returns the school-major relation.",
    type: MstSchoolMajor,
  })
  @ApiResponse({ status: 404, description: "School-Major relation not found." })
  findOne(@Param("id") id: string) {
    return this.mstSchoolMajorsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a school-major relation",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The school-major relation has been successfully updated.",
    type: MstSchoolMajor,
  })
  @ApiResponse({ status: 404, description: "School-Major relation not found." })
  @ApiResponse({ status: 409, description: "School-Major relation already exists." })
  update(
    @Param("id") id: string,
    @Body() updateMstSchoolMajorDto: UpdateMstSchoolMajorDto,
  ) {
    return this.mstSchoolMajorsService.update(id, updateMstSchoolMajorDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a school-major relation",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The school-major relation has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "School-Major relation not found." })
  remove(@Param("id") id: string) {
    return this.mstSchoolMajorsService.remove(id);
  }
}

