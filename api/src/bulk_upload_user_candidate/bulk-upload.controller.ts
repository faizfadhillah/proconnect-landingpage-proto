import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { BulkUploadService } from "./service/bulk-upload.service";
import { UploadBatch } from "./entity/upload_batch.entity";
import { RowStatus } from "./entity/upload_batch_row.entity";
import { BatchRowWithEmailStatus } from "./dao/upload-batch-rows.dao";
import { EmailService } from "src/notifications/email/service/email.service";
import { RetryEmailDto } from "./dto/retry-email.dto";
import { DeleteBulkUploadService } from "./service/delete-bulk-upload.service";
import { TemplateService } from "./service/template.service";
import { UPLOAD_BATCH_ROW_TYPES } from "./constants/constants";
import { Response } from "express";
import { BasePagination } from "src/base.pagination";
import { RequestContextService } from "src/common/request-context/request-context.service";

@ApiTags("bulk-upload")
@Controller("bulk-upload/users/candidate")
@ApiBearerAuth()
export class BulkUploadController {
  constructor(
    private readonly bulkUploadService: BulkUploadService,
    private readonly deleteBulkUploadService: DeleteBulkUploadService,
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService,
    private readonly requestContextService: RequestContextService,
  ) { }

  @Post("import")
  @ApiOperation({ summary: "Import candidate users from Excel/CSV file" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
          description: "Excel (.xlsx) or CSV file with candidate data",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "File uploaded successfully and processing started",
    type: Object,
  })
  @ApiResponse({ status: 400, description: "Invalid file format or validation errors" })
  @UseInterceptors(FileInterceptor("file", {
    storage: diskStorage({
      destination: "./uploads",
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
        "text/csv"
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new BadRequestException("Hanya file Excel dan CSV yang diperbolehkan."),
          false,
        );
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }))
  async importCandidates(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{
    batch: UploadBatch;
    totalRows: number;
    message: string;
  }> {
    if (!file) {
      throw new BadRequestException("File tidak ditemukan.");
    }

    return await this.bulkUploadService.processBulkUpload(file);
  }

  @Get("batches/:id")
  @ApiOperation({ summary: "Get batch processing progress" })
  @ApiResponse({
    status: 200,
    description: "Batch progress retrieved successfully",
    type: Object,
  })
  @ApiResponse({ status: 400, description: "Batch not found" })
  async getBatchProgress(
    @Param("id") batchId: string,
  ): Promise<{
    id: string;
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    progress_percentage: number;
    created_at: Date;
  }> {
    return await this.bulkUploadService.getBatchProgress(batchId);
  }

  @Post("retry-email-all")
  @ApiOperation({ summary: "Retry all failed emails for bulk upload by type" })
  @ApiBody({ type: RetryEmailDto })
  @ApiResponse({
    status: 200,
    description: "Failed emails retried successfully",
    type: Object,
  })
  async retryFailedEmails(
    @Body() dto: RetryEmailDto,
  ): Promise<{ message: string; retryCount: number }> {
    return await this.emailService.retryFailedEmails(dto.type);
  }

  @Delete("delete-failed")
  @ApiOperation({ summary: "Delete failed registrations from a batch or by row ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        batchId: {
          type: "string",
          description: "Batch ID to delete all failed registrations from",
          example: "123e4567-e89b-12d3-a456-426614174001",
        },
        rowId: {
          type: "string",
          description: "Row ID to delete a specific failed registration",
          example: "123e4567-e89b-12d3-a456-426614174002",
        },
      },
      oneOf: [
        { required: ["batchId"] },
        { required: ["rowId"] },
      ],
    },
  })
  @ApiResponse({
    status: 200,
    description: "Failed registrations deleted successfully",
    type: Object,
  })
  @ApiResponse({ status: 400, description: "Invalid request or row not found" })
  async deleteFailedRegistrations(
    @Body() body: { batchId?: string; rowId?: string },
  ): Promise<{ message: string; deletedCount: number }> {
    if (body.rowId) {
      return await this.deleteBulkUploadService.deleteFailedRegistrationsByRowId(body.rowId);
    } else if (body.batchId) {
      return await this.deleteBulkUploadService.deleteFailedRegistrations(body.batchId);
    } else {
      throw new BadRequestException("Either batchId or rowId must be provided");
    }
  }

  @Get("template")
  @ApiOperation({ summary: "Download Excel template for bulk candidate upload" })
  @ApiResponse({
    status: 200,
    description: "Excel template file downloaded successfully",
    content: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid template type" })
  async downloadTemplate(
    @Res() res: Response,
  ): Promise<void> {
    const workbook = await this.templateService.generateTemplate(UPLOAD_BATCH_ROW_TYPES.CANDIDATE_REGISTRATION);

    // Set headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bulk_candidate_upload_template.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  @Get("batches")
  @ApiOperation({ summary: "List upload batches with optional status filter" })
  @ApiQuery({ name: "status", required: false, description: "Filter by batch status (completed, processing, failed)" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Page number" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Items per page" })
  @ApiResponse({
    status: 200,
    description: "Batches retrieved successfully",
    type: BasePagination<UploadBatch>,
  })
  async listBatches(
    @Query("status") status?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ): Promise<BasePagination<UploadBatch>> {
    return await this.bulkUploadService.listBatches({
      status,
      page: page || 1,
      limit: limit || 10,
      userId: this.requestContextService.getCurrentUserId(),
    });
  }

  @Get("batches/:batchId/rows")
  @ApiOperation({ summary: "List batch rows with filters including email status" })
  @ApiQuery({ name: "email", required: false, description: "Filter by email" })
  @ApiQuery({ name: "phone", required: false, description: "Filter by phone" })
  @ApiQuery({ name: "gender", required: false, description: "Filter by gender" })
  @ApiQuery({ name: "status", required: false, enum: RowStatus, description: "Filter by row status" })
  @ApiQuery({ name: "type", required: false, description: "Filter by row type" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Page number" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Items per page" })
  @ApiResponse({
    status: 200,
    description: "Batch rows retrieved successfully with email status",
    type: BasePagination<BatchRowWithEmailStatus>,
  })
  @ApiResponse({ status: 404, description: "Batch not found" })
  async listBatchRows(
    @Param("batchId") batchId: string,
    @Query("email") email?: string,
    @Query("phone") phone?: string,
    @Query("gender") gender?: string,
    @Query("status") status?: RowStatus,
    @Query("type") type?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ): Promise<BasePagination<BatchRowWithEmailStatus>> {
    return await this.bulkUploadService.listBatchRows(batchId, {
      email,
      phone,
      gender,
      status,
      type,
      page: page || 1,
      limit: limit || 10,
    });
  }
}