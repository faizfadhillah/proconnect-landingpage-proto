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
import { MstSalaryCountryService } from "./mst_salary_country.service";
import { CreateMstSalaryCountryDto } from "./dto/create-mst_salary_country.dto";
import { UpdateMstSalaryCountryDto } from "./dto/update-mst_salary_country.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MstSalaryCountry } from "./entities/mst_salary_country.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

@Controller("mst-salary-country")
@ApiTags("mst-salary-country")
@ApiBearerAuth()
export class MstSalaryCountryController {
  constructor(
    private readonly mstSalaryCountryService: MstSalaryCountryService,
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
    type: BasePagination<MstSalaryCountry>,
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
    return this.fieldsService.search(MstSalaryCountry, {
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
    return this.fieldsService.importFromExcel(MstSalaryCountry, file);
  }

  @Post()
  @ApiOperation({
    summary: "Create a new MstSalaryCountry",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The MstSalaryCountry has been successfully created.",
    type: MstSalaryCountry,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createMstSalaryCountryDto: CreateMstSalaryCountryDto) {
    return this.mstSalaryCountryService.create(createMstSalaryCountryDto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a MstSalaryCountry by ID",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The MstSalaryCountry has been successfully updated.",
    type: MstSalaryCountry,
  })
  @ApiResponse({ status: 404, description: "MstSalaryCountry not found." })
  update(
    @Param("id") id: string,
    @Body() updateMstSalaryCountryDto: UpdateMstSalaryCountryDto,
  ) {
    return this.mstSalaryCountryService.update(id, updateMstSalaryCountryDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a MstSalaryCountry by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The MstSalaryCountry has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "MstSalaryCountry not found." })
  remove(@Param("id") id: string) {
    return this.mstSalaryCountryService.remove(id);
  }
}
