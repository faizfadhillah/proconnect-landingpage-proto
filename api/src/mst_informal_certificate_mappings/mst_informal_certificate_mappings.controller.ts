import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { MstInformalCertificateMappingsService } from "./mst_informal_certificate_mappings.service";
import { MstInformalCertificateMapping } from "./entities/mst_informal_certificate_mapping.entity";
import { CreateInformalCertificateMappingDto } from "./dto/create-informal-certificate-mapping.dto";
import { UpdateInformalCertificateMappingDto } from "./dto/update-informal-certificate-mapping.dto";
import { UploadMappingResponseDto } from "./dto/upload-mapping.dto";
import { BasePagination } from "../base.pagination";
import { DynamicFiltersDto } from "../zfields/dto/dynamic-filters.dto";
import { FieldsService } from "../zfields/fields.service";
import { LicenseVerificationResponseDto } from "./dto/license-verification-student-response.dto";
import { ApproveCertificateDto } from "./dto/approve-certificate.dto";
import { UserCertificate } from "../user_certificates/entities/user_certificates.entity";

@ApiTags("mst-informal-certificate-mappings")
@ApiBearerAuth()
@Controller("mst-informal-certificate-mappings")
export class MstInformalCertificateMappingsController {
  constructor(
    private readonly service: MstInformalCertificateMappingsService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create informal certificate mapping" })
  @ApiResponse({
    status: 201,
    description: "Mapping created successfully",
    type: MstInformalCertificateMapping,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  async create(
    @Body(ValidationPipe) dto: CreateInformalCertificateMappingDto,
  ): Promise<MstInformalCertificateMapping> {
    return await this.service.create(dto);
  }

  @Get("search")
  @ApiOperation({ summary: "Search informal certificate mappings" })
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
    type: BasePagination<MstInformalCertificateMapping>,
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

    return this.fieldsService.search(MstInformalCertificateMapping, {
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

  @Get("template/download")
  @ApiOperation({ summary: "Download Excel template for bulk upload" })
  @ApiResponse({
    status: 200,
    description: "Template downloaded successfully",
  })
  async downloadTemplate(@Res() res: Response): Promise<void> {
    return await this.service.downloadTemplate(res);
  }

  @Get("students")
  @ApiOperation({
    summary: "Get students with licenses for license verification dashboard",
  })
  @ApiQuery({ name: "name", required: false, type: String })
  @ApiQuery({ name: "email", required: false, type: String })
  @ApiQuery({ name: "phone", required: false, type: String })
  @ApiQuery({ name: "license_id", required: false, type: String })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["ALL", "VERIFIED", "PENDING"],
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description:
      "Returns list of students with licenses and summary statistics",
    type: LicenseVerificationResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getStudentsWithLicenses(
    @Query("name") name?: string,
    @Query("email") email?: string,
    @Query("phone") phone?: string,
    @Query("license_id") license_id?: string,
    @Query("status") status?: "ALL" | "VERIFIED" | "PENDING",
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ): Promise<BasePagination<any> & { summary: any }> {
    return await this.service.getStudentsWithLicenses(
      {
        name,
        email,
        phone,
        license_id,
        status: status || "ALL",
      },
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get mapping by ID" })
  @ApiResponse({
    status: 200,
    description: "Mapping retrieved successfully",
    type: MstInformalCertificateMapping,
  })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async findOne(
    @Param("id") id: string,
  ): Promise<MstInformalCertificateMapping> {
    return await this.service.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update mapping (only if UNPROCESSED)" })
  @ApiResponse({
    status: 200,
    description: "Mapping updated successfully",
    type: MstInformalCertificateMapping,
  })
  @ApiResponse({ status: 400, description: "Cannot update processed mapping" })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async update(
    @Param("id") id: string,
    @Body(ValidationPipe) dto: UpdateInformalCertificateMappingDto,
  ): Promise<MstInformalCertificateMapping> {
    return await this.service.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete mapping (only if UNPROCESSED)" })
  @ApiResponse({ status: 200, description: "Mapping deleted successfully" })
  @ApiResponse({ status: 400, description: "Cannot delete processed mapping" })
  @ApiResponse({ status: 404, description: "Mapping not found" })
  async remove(@Param("id") id: string): Promise<{ success: boolean }> {
    await this.service.remove(id);
    return { success: true };
  }

  @Patch("certificates/:id/approval")
  @ApiOperation({
    summary: "Approve/reject certificate verification (Admin only)",
    operationId: "approveCertificate",
  })
  @ApiResponse({
    status: 200,
    description: "The certificate verification status has been updated.",
    type: UserCertificate,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 404, description: "Certificate not found." })
  async approveCertificate(
    @Param("id") id: string,
    @Body(ValidationPipe) dto: ApproveCertificateDto,
    @Request() req: any,
  ): Promise<UserCertificate> {
    // Get approval_by from logged-in user's email
    const approvalBy = req.user?.email || req.firebaseUser?.email || "system";
    return this.service.approveCertificate(id, dto.approval_state, approvalBy);
  }

  @Post("upload")
  @ApiOperation({ summary: "Upload informal certificate mappings via Excel" })
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
          cb(new Error("Only Excel files are allowed."), false);
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
