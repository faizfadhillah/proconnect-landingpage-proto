import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { Response } from "express";
import { MstEducationProfessionMappingsService } from "./mst_education_profession_mappings.service";
import { MstEducationProfessionMapping } from "./entities/mst_education_profession_mapping.entity";
import { CreateEducationProfessionMappingDto } from "./dto/create-education-profession-mapping.dto";
import { UpdateEducationProfessionMappingDto } from "./dto/update-education-profession-mapping.dto";
import { UploadMappingResponseDto } from "./dto/upload-mapping.dto";
import { BasePagination } from "../base.pagination";
import { DynamicFiltersDto } from "../zfields/dto/dynamic-filters.dto";
import { FieldsService } from "../zfields/fields.service";
import { GroupedEducationProfessionResponseDto } from "./dto/grouped-education-profession-response.dto";
import { GetGroupedFiltersDto } from "./dto/get-grouped-filters.dto";

@ApiTags("mst-education-profession-mappings")
@ApiBearerAuth()
@Controller("mst-education-profession-mappings")
export class MstEducationProfessionMappingsController {
  constructor(
    private readonly service: MstEducationProfessionMappingsService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create education profession mapping" })
  @ApiResponse({
    status: 201,
    description: "Mapping created successfully",
    type: MstEducationProfessionMapping,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Duplicate or invalid data",
  })
  async create(
    @Body(ValidationPipe) dto: CreateEducationProfessionMappingDto,
  ): Promise<MstEducationProfessionMapping> {
    return await this.service.create(dto);
  }

  @Get("search")
  @ApiOperation({ summary: "Search education profession mappings" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({
    name: "filters",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic filters for searching",
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
  })
  @ApiQuery({ name: "expands", required: false })
  @ApiQuery({ name: "isExcel", required: false })
  @ApiResponse({
    status: 200,
    description: "Returns list of mappings",
    type: BasePagination<MstEducationProfessionMapping>,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Query("id") id?: string,
    @Query("filters") filters?: DynamicFiltersDto,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("sortBy") sortBy?: any,
    @Query("expands") expands?: string,
    @Query("isExcel") isExcel?: string,
    @Res() res?: Response,
  ) {
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);

    return this.fieldsService.search(MstEducationProfessionMapping, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands: expands || '',
      isExcel,
      res,
      options: {},
    });
  }

  @Get("grouped")
  @ApiOperation({ summary: "Get grouped education profession mappings with pagination" })
  @ApiResponse({
    status: 200,
    description: "Returns paginated grouped education profession mappings",
    type: BasePagination<GroupedEducationProfessionResponseDto>,
  })
  @ApiResponse({ status: 400, description: "Bad request - Invalid query parameters" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getGrouped(
    @Query(ValidationPipe) filters: GetGroupedFiltersDto,
  ): Promise<BasePagination<GroupedEducationProfessionResponseDto>> {
    return await this.service.getGroupedMappings(filters);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get mapping by ID" })
  @ApiResponse({
    status: 200,
    description: "Mapping retrieved successfully",
    type: MstEducationProfessionMapping,
  })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async findOne(
    @Param("id") id: string
  ): Promise<MstEducationProfessionMapping> {
    return await this.service.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update mapping" })
  @ApiResponse({
    status: 200,
    description: "Mapping updated successfully",
    type: MstEducationProfessionMapping,
  })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async update(
    @Param("id") id: string,
    @Body(ValidationPipe) dto: UpdateEducationProfessionMappingDto,
  ): Promise<MstEducationProfessionMapping> {
    return await this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete mapping" })
  @ApiResponse({ status: 200, description: "Mapping deleted successfully" })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async remove(
    @Param("id") id: string,
  ): Promise<{ success: boolean }> {
    await this.service.remove(id);
    return { success: true };
  }

  @Get("template/download")
  @ApiOperation({ summary: "Download Excel template for bulk upload" })
  @ApiResponse({
    status: 200,
    description: "Template downloaded successfully",
  })
  async downloadTemplate(@Res() res: Response): Promise<void> {
    return await this.service.downloadTemplate(res);
  }

  @Post("upload")
  @ApiOperation({ summary: "Upload education profession mappings via Excel" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "File processed successfully",
    type: UploadMappingResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
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
            new Error("Only Excel files are allowed."),
            false,
          );
        }
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadMappingResponseDto> {
    return await this.service.uploadMappings(file);
  }
}

