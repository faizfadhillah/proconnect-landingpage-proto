import {
  Controller,
  Query,
  Res,
  Body,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { PendingStudentVerificationsService } from "../service/pending_student_verifications.service";
import { CreatePendingStudentVerificationDto } from "../dto/create-pending_student_verification.dto";
import { PendingStudentVerification } from "../entities/pending_student_verification.entity";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { BasePagination } from "src/base.pagination";
import { Response } from "express";
import { UpdatePendingStudentVerificationDto } from "../dto/update-pending_student_verification.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as ExcelJS from "exceljs";

@Controller("pending-student-verifications")
@ApiTags("pending-student-verifications")
@ApiBearerAuth()
export class PendingStudentVerificationsController {
  constructor(
    private readonly pendingStudentVerificationsService: PendingStudentVerificationsService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Get("search")
  @ApiOperation({
    summary: "Search pending student verifications (not-found buffer)",
    operationId: "searchPendingStudentVerifications",
  })
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
    example: { student_id: "", school_id: "" },
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
    description: "Returns the list of pending student verifications.",
    type: BasePagination<PendingStudentVerification>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
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
    return this.fieldsService.search(PendingStudentVerification, {
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

  @Post()
  @ApiOperation({
    summary: "Create pending student verification (upload/admin only)",
    operationId: "createPendingStudentVerification",
  })
  @ApiResponse({ status: 201, type: PendingStudentVerification })
  async create(
    @Body() dto: CreatePendingStudentVerificationDto,
  ): Promise<PendingStudentVerification> {
    return this.pendingStudentVerificationsService.create(dto);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete pending student verification by ID",
    operationId: "deletePendingStudentVerification",
  })
  @ApiResponse({ status: 200 })
  async remove(@Param("id") id: string): Promise<void> {
    return this.pendingStudentVerificationsService.remove(id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update pending student verification",
    operationId: "updatePendingStudentVerification",
  })
  @ApiResponse({ status: 200, type: PendingStudentVerification })
  @ApiResponse({ status: 404, description: "Not found" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdatePendingStudentVerificationDto,
  ): Promise<PendingStudentVerification> {
    return this.pendingStudentVerificationsService.update(id, dto);
  }

  @Get("template")
  @ApiOperation({
    summary: "Download Excel template for pending student verifications",
    operationId: "downloadPendingStudentVerificationTemplate",
  })
  @ApiResponse({ status: 200, description: "Excel template file" })
  async downloadTemplate(@Res() res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Template");

    worksheet.columns = [
      { header: "student_id", key: "student_id", width: 25 },
      { header: "school_name", key: "school_name", width: 40 },
      { header: "full_name", key: "full_name", width: 30 },
      { header: "photo_url", key: "photo_url", width: 40 },
      { header: "email", key: "email", width: 30 },
      { header: "phone_num", key: "phone_num", width: 20 },
      { header: "major", key: "major", width: 30 },
      { header: "degree", key: "degree", width: 12 },
      { header: "diploma_level", key: "diploma_level", width: 16 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    worksheet.addRow({
      student_id: "1312022008",
      school_name: "Your School Name",
      full_name: "Jane Doe",
      photo_url: "http://cdn.example.com/photo.png",
      email: "user@example.com",
      phone_num: "+62123456789",
      major: "Computer Science",
      degree: "S1",
      diploma_level: "CERT_III",
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=pending_student_verifications_template.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  @Post("import")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Excel (.xls or .xlsx) file",
        },
      },
      required: ["file"],
    },
  })
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
        const allowedTypes = [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException("Hanya file Excel yang diperbolehkan."), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiOperation({
    summary: "Import pending student verifications from Excel (student_id, school_name)",
    operationId: "importPendingStudentVerifications",
  })
  @ApiResponse({
    status: 200,
    description: "Import result summary",
    schema: {
      example: {
        success_count: 1,
        error_count: 0,
        errors: [],
      },
    },
  })
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{
    success_count: number;
    error_count: number;
    errors: { row: number; message: string }[];
  }> {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    if (!file.path) {
      // With diskStorage configured above, this should always exist.
      // This guard keeps the error message more actionable if runtime storage is misconfigured.
      throw new BadRequestException("Uploaded file path is missing");
    }

    return this.pendingStudentVerificationsService.importFromExcel(file.path);
  }
}

