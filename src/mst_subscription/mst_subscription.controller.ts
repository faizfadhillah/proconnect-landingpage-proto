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
import { MstSubscriptionService } from "./mst_subscription.service";
import { CreateMstSubscriptionDto } from "./dto/create-mst_subscription.dto";
import { UpdateMstSubscriptionDto } from "./dto/update-mst_subscription.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { MstSubscription } from "./entities/mst_subscription.entity";
import { BasePagination } from "src/base.pagination";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { FieldsService } from "src/zfields/fields.service";
import { Response } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

@Controller("mst-subscription")
@ApiTags("mst-subscription")
@ApiBearerAuth()
export class MstSubscriptionController {
  constructor(
    private readonly mstSubscriptionService: MstSubscriptionService,
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
    example: { name: "", description: "" },
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
    type: BasePagination<MstSubscription>,
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
    return this.fieldsService.search(MstSubscription, {
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
    return this.fieldsService.importFromExcel(MstSubscription, file);
  }

  @Post()
  @ApiOperation({ summary: "Create a new subscription", operationId: "create" })
  create(@Body() createMstSubscriptionDto: CreateMstSubscriptionDto) {
    return this.mstSubscriptionService.create(createMstSubscriptionDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all subscriptions", operationId: "findAll" })
  findAll() {
    return this.mstSubscriptionService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a subscription by ID", operationId: "findOne" })
  findOne(@Param("id") id: string) {
    return this.mstSubscriptionService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a subscription by ID",
    operationId: "update",
  })
  update(
    @Param("id") id: string,
    @Body() updateMstSubscriptionDto: UpdateMstSubscriptionDto,
  ) {
    return this.mstSubscriptionService.update(id, updateMstSubscriptionDto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a subscription by ID",
    operationId: "remove",
  })
  remove(@Param("id") id: string) {
    return this.mstSubscriptionService.remove(id);
  }
}
