// src\mst_schools\mst_schools.controller.ts
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
  UseInterceptors,
  HttpException,
  HttpStatus,
  UploadedFile,
} from "@nestjs/common";
import { MstSchoolsService } from "./mst_schools.service";
import { CreateMstSchoolDto } from "./dto/create-mst_school.dto";
import { UpdateMstSchoolDto } from "./dto/update-mst_school.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MstSchool } from "./entities/mst_school.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

@Controller("mst-schools")
@ApiTags("mst-schools")
@ApiBearerAuth()
export class MstSchoolsController {
  constructor(
    private readonly mstSchoolsService: MstSchoolsService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Create a new school level",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The school level has been successfully created.",
    type: MstSchool,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createMstSchoolDto: CreateMstSchoolDto) {
    return this.mstSchoolsService.create(createMstSchoolDto);
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
    example: { name: "" },
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
      name: "ASC",
      created_at: "DESC",
    },
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of users matching the search criteria.",
    type: BasePagination<MstSchool>,
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
    return this.fieldsService.search(MstSchool, {
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

  @Post("import-xls")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads", // Direktori sementara
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validasi tipe file
        const allowedTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new HttpException(
              "Hanya file Excel yang diperbolehkan.",
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException("File tidak ditemukan.", HttpStatus.BAD_REQUEST);
    }
    return this.fieldsService.importFromExcel(MstSchool, file);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an school level", operationId: "update" })
  @ApiResponse({
    status: 200,
    description: "The school level has been successfully updated.",
    type: MstSchool,
  })
  @ApiResponse({ status: 404, description: "School level not found." })
  update(
    @Param("id") id: string,
    @Body() updateMstSchoolDto: UpdateMstSchoolDto,
  ) {
    return this.mstSchoolsService.update(id, updateMstSchoolDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an school level", operationId: "remove" })
  @ApiResponse({
    status: 204,
    description: "The school level has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "School level not found." })
  remove(@Param("id") id: string) {
    return this.mstSchoolsService.remove(id);
  }
}
