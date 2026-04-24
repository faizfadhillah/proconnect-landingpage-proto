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
import { MstTagsService } from "./mst_tags.service";
import { CreateMstTagDto } from "./dto/create-mst_tag.dto";
import { UpdateMstTagDto } from "./dto/update-mst_tag.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MstTag } from "./entities/mst_tag.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

@Controller("mst-tags")
@ApiTags("mst-tags")
@ApiBearerAuth()
export class MstTagsController {
  constructor(
    private readonly mstTagsService: MstTagsService,
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
    type: BasePagination<MstTag>,
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
    return this.fieldsService.search(MstTag, {
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
    return this.fieldsService.importFromExcel(MstTag, file);
  }

  @Post()
  @ApiOperation({ summary: "Create a new MstTag", operationId: "create" })
  create(@Body() createMstTagDto: CreateMstTagDto) {
    return this.mstTagsService.create(createMstTagDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all MstTags", operationId: "findAll" })
  findAll() {
    return this.mstTagsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an MstTag by ID", operationId: "findOne" })
  findOne(@Param("id") id: string) {
    return this.mstTagsService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an MstTag by ID", operationId: "update" })
  update(@Param("id") id: string, @Body() updateMstTagDto: UpdateMstTagDto) {
    return this.mstTagsService.update(id, updateMstTagDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an MstTag by ID", operationId: "remove" })
  remove(@Param("id") id: string) {
    return this.mstTagsService.remove(id);
  }
}
