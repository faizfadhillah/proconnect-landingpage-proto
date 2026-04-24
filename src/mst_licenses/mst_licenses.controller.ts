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
import { MstLicensesService } from "./mst_licenses.service";
import { CreateMstLicenseDto } from "./dto/create-mst_license.dto";
import { UpdateMstLicenseDto } from "./dto/update-mst_license.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MstLicense } from "./entities/mst_license.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

@Controller("mst-licenses")
@ApiTags("mst-licenses")
@ApiBearerAuth()
export class MstLicensesController {
  constructor(
    private readonly mstLicensesService: MstLicensesService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Create a new master license",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The master license has been successfully created.",
    type: MstLicense,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createMstLicenseDto: CreateMstLicenseDto) {
    return this.mstLicensesService.create(createMstLicenseDto);
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
    example: { license_name: "" },
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
      license_name: "ASC",
      created_at: "DESC",
    },
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of licenses matching the search criteria.",
    type: BasePagination<MstLicense>,
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
    return this.fieldsService.search(MstLicense, {
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
        destination: "./uploads", // Temporary directory
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validate file type
        const allowedTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new HttpException(
              "Only Excel files are allowed.",
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
      throw new HttpException("File not found.", HttpStatus.BAD_REQUEST);
    }
    return this.fieldsService.importFromExcel(MstLicense, file);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a master license by ID", operationId: "findOne" })
  @ApiResponse({
    status: 200,
    description: "Returns the master license.",
    type: MstLicense,
  })
  @ApiResponse({ status: 404, description: "Master license not found." })
  findOne(@Param("id") id: string) {
    return this.mstLicensesService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a master license", operationId: "update" })
  @ApiResponse({
    status: 200,
    description: "The master license has been successfully updated.",
    type: MstLicense,
  })
  @ApiResponse({ status: 404, description: "Master license not found." })
  update(
    @Param("id") id: string,
    @Body() updateMstLicenseDto: UpdateMstLicenseDto,
  ) {
    return this.mstLicensesService.update(id, updateMstLicenseDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a master license", operationId: "remove" })
  @ApiResponse({
    status: 204,
    description: "The master license has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "Master license not found." })
  remove(@Param("id") id: string) {
    return this.mstLicensesService.remove(id);
  }
}