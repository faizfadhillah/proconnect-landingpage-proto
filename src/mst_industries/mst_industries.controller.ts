// src\mst_skills\mst_skills.controller.ts
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
import { MstIndustriesService } from "./mst_industries.service";
import { CreateMstIndustryDto } from "./dto/create-mst_industry.dto";
import { UpdateMstIndustryDto } from "./dto/update-mst_industry.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MstIndustry } from "./entities/mst_industry.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

@Controller("mst-industries")
@ApiTags("mst-industries")
@ApiBearerAuth()
export class MstIndustriesController {
  constructor(
    private readonly mstIndustriesService: MstIndustriesService,
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
    example: { name: "" },
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
    type: BasePagination<MstIndustry>,
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
    return this.fieldsService.search(MstIndustry, {
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
    return this.fieldsService.importFromExcel(MstIndustry, file);
  }

  @Post()
  @ApiOperation({ summary: "Create a new MstIndustry", operationId: "create" })
  @ApiResponse({
    status: 201,
    description: "The MstIndustry has been successfully created.",
    type: MstIndustry,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createMstIndustryDto: CreateMstIndustryDto) {
    return this.mstIndustriesService.create(createMstIndustryDto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a MstIndustry by ID",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The MstIndustry has been successfully updated.",
    type: MstIndustry,
  })
  @ApiResponse({ status: 404, description: "MstIndustry not found." })
  update(
    @Param("id") id: string,
    @Body() updateMstIndustryDto: UpdateMstIndustryDto,
  ) {
    return this.mstIndustriesService.update(id, updateMstIndustryDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a MstIndustry by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The MstIndustry has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "MstIndustry not found." })
  remove(@Param("id") id: string) {
    return this.mstIndustriesService.remove(id);
  }
}
