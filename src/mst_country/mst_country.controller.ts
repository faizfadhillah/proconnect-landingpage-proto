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
import { MstCountryService } from "./mst_country.service";
import { CreateMstCountryDto } from "./dto/create-mst_country.dto";
import { UpdateMstCountryDto } from "./dto/update-mst_country.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MstCountry } from "./entities/mst_country.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { Public } from "src/auth/public.decorator";

@Controller("mst-country")
@ApiTags("mst-country")
@ApiBearerAuth()
export class MstCountryController {
  constructor(
    private readonly mstCountryService: MstCountryService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Get("search")
  @Public()
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
    type: BasePagination<MstCountry>,
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
    return this.fieldsService.search(MstCountry, {
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
    return this.fieldsService.importFromExcel(MstCountry, file);
  }

  @Post()
  @ApiOperation({
    summary: "Create a new MstCountry",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The MstCountry has been successfully created.",
    type: MstCountry,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createMstCountryDto: CreateMstCountryDto) {
    return this.mstCountryService.create(createMstCountryDto);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a MstCountry by ID",
    operationId: "update",
  })
  @ApiResponse({
    status: 200,
    description: "The MstCountry has been successfully updated.",
    type: MstCountry,
  })
  @ApiResponse({ status: 404, description: "MstCountry not found." })
  update(
    @Param("id") id: string,
    @Body() updateMstCountryDto: UpdateMstCountryDto,
  ) {
    return this.mstCountryService.update(id, updateMstCountryDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a MstCountry by ID",
    operationId: "remove",
  })
  @ApiResponse({
    status: 204,
    description: "The MstCountry has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "MstCountry not found." })
  remove(@Param("id") id: string) {
    return this.mstCountryService.remove(id);
  }
}
