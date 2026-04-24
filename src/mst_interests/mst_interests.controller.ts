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
import { MstInterestsService } from "./mst_interests.service";
import { CreateMstInterestDto } from "./dto/create-mst_interest.dto";
import { UpdateMstInterestDto } from "./dto/update-mst_interest.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MstInterest } from "./entities/mst_interest.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

@Controller("mst-interests")
@ApiTags("mst-interests")
@ApiBearerAuth()
export class MstInterestsController {
  constructor(
    private readonly mstInterestsService: MstInterestsService,
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
    type: BasePagination<MstInterest>,
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
    return this.fieldsService.search(MstInterest, {
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
    return this.fieldsService.importFromExcel(MstInterest, file);
  }

  @Post()
  @ApiOperation({ summary: "Create a new MstInterest", operationId: "create" })
  @ApiResponse({
    status: 201,
    description: "The MstInterest has been successfully created.",
    type: MstInterest,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createMstInterestDto: CreateMstInterestDto) {
    return this.mstInterestsService.create(createMstInterestDto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a MstInterest by ID",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The MstInterest has been successfully updated.",
    type: MstInterest,
  })
  @ApiResponse({ status: 404, description: "MstInterest not found." })
  update(
    @Param("id") id: string,
    @Body() updateMstInterestDto: UpdateMstInterestDto,
  ) {
    return this.mstInterestsService.update(id, updateMstInterestDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a MstInterest by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The MstInterest has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "MstInterest not found." })
  remove(@Param("id") id: string) {
    return this.mstInterestsService.remove(id);
  }
}
