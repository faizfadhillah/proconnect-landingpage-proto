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
import { MstMajorsService } from "./mst_majors.service";
import { CreateMstMajorDto } from "./dto/create-mst_major.dto";
import { UpdateMstMajorDto } from "./dto/update-mst_major.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MstMajor } from "./entities/mst_major.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

@Controller("mst-majors")
@ApiTags("mst-majors")
@ApiBearerAuth()
export class MstMajorsController {
  constructor(
    private readonly mstMajorsService: MstMajorsService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Create a new master major",
    operationId: "create",
  })
  @ApiResponse({
    status: 201,
    description: "The master major has been successfully created.",
    type: MstMajor,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 409, description: "Major name already exists." })
  create(@Body() createMstMajorDto: CreateMstMajorDto) {
    return this.mstMajorsService.create(createMstMajorDto);
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
    example: { major_name: "" },
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
      major_name: "ASC",
      created_at: "DESC",
    },
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of majors matching the search criteria.",
    type: BasePagination<MstMajor>,
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
    return this.fieldsService.search(MstMajor, {
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
    return this.fieldsService.importFromExcel(MstMajor, file);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a master major by ID", operationId: "findOne" })
  @ApiResponse({
    status: 200,
    description: "Returns the master major.",
    type: MstMajor,
  })
  @ApiResponse({ status: 404, description: "Master major not found." })
  findOne(@Param("id") id: string) {
    return this.mstMajorsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a master major", operationId: "update" })
  @ApiResponse({
    status: 200,
    description: "The master major has been successfully updated.",
    type: MstMajor,
  })
  @ApiResponse({ status: 404, description: "Master major not found." })
  @ApiResponse({ status: 409, description: "Major name already exists." })
  update(
    @Param("id") id: string,
    @Body() updateMstMajorDto: UpdateMstMajorDto,
  ) {
    return this.mstMajorsService.update(id, updateMstMajorDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a master major", operationId: "remove" })
  @ApiResponse({
    status: 204,
    description: "The master major has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "Master major not found." })
  remove(@Param("id") id: string) {
    return this.mstMajorsService.remove(id);
  }
}