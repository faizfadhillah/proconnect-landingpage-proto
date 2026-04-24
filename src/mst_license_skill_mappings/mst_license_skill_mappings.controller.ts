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
import { MstLicenseSkillMappingsService } from "./mst_license_skill_mappings.service";
import { MstLicenseSkillMapping } from "./entities/mst_license_skill_mapping.entity";
import { CreateLicenseSkillMappingDto } from "./dto/create-license-skill-mapping.dto";
import { UpdateLicenseSkillMappingDto } from "./dto/update-license-skill-mapping.dto";
import { UploadLicenseSkillMappingResponseDto } from "./dto/upload-license-skill-mapping.dto";
import { GroupedLicenseSkillResponseDto } from "./dto/grouped-license-skill-response.dto";
import { GetGroupedFiltersDto } from "./dto/get-grouped-filters.dto";
import { BasePagination } from "../base.pagination";
import { DynamicFiltersDto } from "../zfields/dto/dynamic-filters.dto";
import { FieldsService } from "../zfields/fields.service";

@ApiTags("mst-license-skill-mappings")
@ApiBearerAuth()
@Controller("mst-license-skill-mappings")
export class MstLicenseSkillMappingsController {
  constructor(
    private readonly service: MstLicenseSkillMappingsService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create license skill mapping" })
  @ApiResponse({
    status: 201,
    description: "Mapping created successfully",
    type: MstLicenseSkillMapping,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Duplicate or invalid data",
  })
  async create(
    @Body(ValidationPipe) dto: CreateLicenseSkillMappingDto,
  ): Promise<MstLicenseSkillMapping> {
    return await this.service.create(dto);
  }

  @Get("search")
  @ApiOperation({ summary: "Search license skill mappings" })
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
    type: BasePagination<MstLicenseSkillMapping>,
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

    return this.fieldsService.search(MstLicenseSkillMapping, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      user,
      options: {},
      isExcel,
      res,
    });
  }

  @Get("grouped")
  @ApiOperation({ summary: "Get grouped license skill mappings with pagination" })
  @ApiResponse({
    status: 200,
    description: "Returns paginated grouped license skill mappings",
    type: BasePagination<GroupedLicenseSkillResponseDto>,
  })
  @ApiResponse({ status: 400, description: "Bad request - Invalid query parameters" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getGrouped(
    @Query(ValidationPipe) filters: GetGroupedFiltersDto,
  ): Promise<BasePagination<GroupedLicenseSkillResponseDto>> {
    return await this.service.getGroupedMappings(filters);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get mapping by ID" })
  @ApiResponse({
    status: 200,
    description: "Mapping retrieved successfully",
    type: MstLicenseSkillMapping,
  })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async findOne(@Param("id") id: string): Promise<MstLicenseSkillMapping> {
    return await this.service.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update mapping" })
  @ApiResponse({
    status: 200,
    description: "Mapping updated successfully",
    type: MstLicenseSkillMapping,
  })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async update(
    @Param("id") id: string,
    @Body(ValidationPipe) dto: UpdateLicenseSkillMappingDto,
  ): Promise<MstLicenseSkillMapping> {
    return await this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete mapping" })
  @ApiResponse({ status: 200, description: "Mapping deleted successfully" })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async remove(@Param("id") id: string): Promise<{ success: boolean }> {
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
  @ApiOperation({ summary: "Upload license skill mappings via Excel" })
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
    type: UploadLicenseSkillMappingResponseDto,
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
  ): Promise<UploadLicenseSkillMappingResponseDto> {
    return await this.service.uploadMappings(file);
  }
}

