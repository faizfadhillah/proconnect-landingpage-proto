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
  Request,
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
import { MstEducationLicenseMappingsService } from "./mst_education_license_mappings.service";
import { MstEducationLicenseMapping } from "./entities/mst_education_license_mapping.entity";
import { CreateEducationLicenseMappingDto } from "./dto/create-education-license-mapping.dto";
import { UpdateEducationLicenseMappingDto } from "./dto/update-education-license-mapping.dto";
import { UploadMappingResponseDto } from "./dto/upload-mapping.dto";
import { GroupedEducationLicenseResponseDto } from "./dto/grouped-education-license-response.dto";
import { GetGroupedFiltersDto } from "./dto/get-grouped-filters.dto";
import { BasePagination } from "../base.pagination";
import { DynamicFiltersDto } from "../zfields/dto/dynamic-filters.dto";
import { FieldsService } from "../zfields/fields.service";

@ApiTags("mst-education-license-mappings")
@ApiBearerAuth()
@Controller("mst-education-license-mappings")
export class MstEducationLicenseMappingsController {
  constructor(
    private readonly service: MstEducationLicenseMappingsService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create education license mapping" })
  @ApiResponse({
    status: 201,
    description: "Mapping created successfully",
    type: MstEducationLicenseMapping,
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - No permission for this school",
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Duplicate or invalid data",
  })
  async create(
    @Body(ValidationPipe) dto: CreateEducationLicenseMappingDto,
    @Request() req,
  ): Promise<MstEducationLicenseMapping> {
    return await this.service.create(dto, req.user.id);
  }

  @Get("search")
  @ApiOperation({ summary: "Search education license mappings" })
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
    type: BasePagination<MstEducationLicenseMapping>,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Request() req,
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
    const user: any = req.user;

    return this.service.search({
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      isExcel,
      res,
      user,
    });
  }

  @Get("grouped")
  @ApiOperation({ summary: "Get grouped education license mappings with pagination" })
  @ApiResponse({
    status: 200,
    description: "Returns paginated grouped education license mappings",
    type: BasePagination<GroupedEducationLicenseResponseDto>,
  })
  @ApiResponse({ status: 400, description: "Bad request - Invalid query parameters" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getGrouped(
    @Request() req,
    @Query(ValidationPipe) filters: GetGroupedFiltersDto,
  ): Promise<BasePagination<GroupedEducationLicenseResponseDto>> {
    const user: any = req.user;
    return await this.service.getGroupedMappings(user, filters);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get mapping by ID" })
  @ApiResponse({
    status: 200,
    description: "Mapping retrieved successfully",
    type: MstEducationLicenseMapping,
  })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async findOne(
    @Param("id") id: string
  ): Promise<MstEducationLicenseMapping> {
    return await this.service.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update mapping" })
  @ApiResponse({
    status: 200,
    description: "Mapping updated successfully",
    type: MstEducationLicenseMapping,
  })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async update(
    @Param("id") id: string,
    @Body(ValidationPipe) dto: UpdateEducationLicenseMappingDto,
    @Request() req,
  ): Promise<MstEducationLicenseMapping> {
    return await this.service.update(id, dto, req.user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete mapping" })
  @ApiResponse({ status: 200, description: "Mapping deleted successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async remove(
    @Param("id") id: string,
    @Request() req,
  ): Promise<{ success: boolean }> {
    await this.service.remove(id, req.user.id);
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
  @ApiOperation({ summary: "Upload education license mappings via Excel" })
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
    @Request() req,
  ): Promise<UploadMappingResponseDto> {
    return await this.service.uploadMappings(file, req.user.id);
  }
}

