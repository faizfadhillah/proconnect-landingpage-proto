import { Injectable, BadRequestException, Inject, forwardRef } from "@nestjs/common";
import { LoggingService } from "src/logs/logs.service";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../../users/users.service";
import { UsersDao } from "../../users/users.dao";
import { UploadBatchesDao } from "../dao/upload-batches.dao";
import { UploadBatchRowsDao, BatchRowWithEmailStatus } from "../dao/upload-batch-rows.dao";
import { UploadBatch } from "../entity/upload_batch.entity";
import { UploadBatchRow, RowStatus } from "../entity/upload_batch_row.entity";
import { UPLOAD_BATCH_ROW_TYPES, CandidateRegistrationData } from "../constants/constants";
import { FileParserUtil, ParsedRow } from "../utils/file-parser.util";
import { UserValidationUtil } from "../utils/user-validation.util";
import { FileCleanupUtil } from "../utils/file-cleanup.util";
import { BatchProcessingUtil } from "../utils/batch-processing.util";
import { UserGender } from "../../users/entities/user.entity";
import { RequestContextService } from "src/common/request-context/request-context.service";
import { EmailService } from "src/notifications/email/service/email.service";
import { EMAIL_TYPES } from "src/notifications/email/constants/constants";
import { BasePagination } from "src/base.pagination";
import { EmailLogsDao } from "src/notifications/email/dao/email-logs.dao";

@Injectable()
export class BulkUploadService {
  private readonly userValidationUtil: UserValidationUtil;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly usersDao: UsersDao,
    private readonly uploadBatchesDao: UploadBatchesDao,
    private readonly uploadBatchRowsDao: UploadBatchRowsDao,
    private readonly emailService: EmailService,
    private readonly emailLogsDao: EmailLogsDao,
    private readonly fileParserUtil: FileParserUtil,
    private readonly loggingService: LoggingService,
    private readonly requestContextService: RequestContextService,
  ) {
    this.userValidationUtil = new UserValidationUtil(this.usersDao);
  }

  /**
   * Process bulk upload file
   */
  async processBulkUpload(file: Express.Multer.File): Promise<{
    batch: UploadBatch;
    totalRows: number;
    message: string;
  }> {
    const maxRows = this.configService.get<number>("BULK_UPLOAD_MAX_FILE_ROWS", 5000);
    try {
      // Validate file has content (not just headers)
      if (file.size === 0) {
        throw new BadRequestException("File is empty");
      }

      // Parse file
      this.loggingService.log("Parsing uploaded file...");
      const parsedRows = await this.fileParserUtil.parseFile(file);

      // Check if file has data beyond headers
      if (parsedRows.length === 0) {
        throw new BadRequestException("File contains no data rows (only headers)");
      }

      // check if total row > max row
      if (parsedRows.length > maxRows) {
        throw new BadRequestException(`File contains ${parsedRows.length} rows, maximum allowed is ${maxRows}`);
      }

      // Validate required columns exist
      await this.fileParserUtil.validateRequiredColumns(file);

      const existingEmails = await this.userValidationUtil.checkExistingEmails(parsedRows.map(r => r.email));

      // Validate and normalize data
      this.loggingService.log("Validating and normalizing data...");
      const { validRows, errors } = this.fileParserUtil.validateAndNormalizeData(parsedRows, existingEmails);

      // Create batch
      this.loggingService.log("Creating upload batch...");
      const batch = await this.uploadBatchesDao.create({
        uploaded_by: this.requestContextService.getCurrentUserId(),
        total_rows: parsedRows.length,
        valid_rows: 0, // Start with 0, will be incremented during processing
        invalid_rows: errors.length, // Set validation errors that prevent processing
      });

      // Create batch rows
      const batchRows = this.generateBatchRows(batch, parsedRows, errors);
      await this.uploadBatchRowsDao.createMany(batchRows);

      // Start background processing
      this.loggingService.log("Starting background processing...");
      this.processBatchInBackground(batch.id);

      // Cleanup: Delete file from disk after successful parsing
      FileCleanupUtil.cleanUpFile(file.path, this.loggingService);

      return {
        batch,
        totalRows: validRows.length,
        message: "File uploaded successfully. Processing in background.",
      };
    } catch (error) {
      // Cleanup file on error
      FileCleanupUtil.cleanUpFile(file.path, this.loggingService);

      this.loggingService.error("Error processing bulk upload:", error);
      throw error;
    }
  }

  /**
   * Get batch progress
   */
  async getBatchProgress(batchId: string): Promise<{
    id: string;
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    progress_percentage: number;
    created_at: Date;
  }> {
    const batch = await this.uploadBatchesDao.findById(batchId);
    if (!batch) {
      throw new BadRequestException("Batch not found");
    }

    return {
      id: batch.id,
      total_rows: batch.total_rows,
      valid_rows: batch.valid_rows,
      invalid_rows: batch.invalid_rows,
      progress_percentage: batch.progress_percentage,
      created_at: batch.created_at,
    };
  }

  /**
   * Process batch in background with optimized batch processing
   */
  private async processBatchInBackground(batchId: string): Promise<void> {
    try {
      const batchSize = this.configService.get<number>("BULK_UPLOAD_BATCH_SIZE", 50);
      const delayMs = this.configService.get<number>("BULK_UPLOAD_BATCH_DELAY_MS", 500);
      const maxConcurrent = this.configService.get<number>("BULK_UPLOAD_MAX_CONCURRENT", 5);

      let hasMoreRows = true;
      let processedCount = 0;

      while (hasMoreRows) {
        // Get pending rows for this batch
        const pendingRows = await this.uploadBatchRowsDao.findPendingByBatchId(batchId, batchSize);

        if (pendingRows.length === 0) {
          hasMoreRows = false;
          continue;
        }

        this.loggingService.log(`Processing ${pendingRows.length} rows for batch ${batchId} (total processed: ${processedCount})...`);

        // Process rows in batches with controlled concurrency
        const results = await BatchProcessingUtil.processRowsWithConcurrency(pendingRows, maxConcurrent, this.processSingleRow.bind(this));

        // Update batch progress
        const validCount = results.filter((r: any) => r.success).length;
        const invalidCount = results.filter((r: any) => !r.success).length;

        const batch = await this.uploadBatchesDao.findById(batchId);
        if (batch) {
          await this.uploadBatchesDao.updateProgress(
            batchId,
            batch.valid_rows + validCount,
            batch.invalid_rows + invalidCount,
          );
        }

        processedCount += pendingRows.length;

        // Add delay between batches to avoid overwhelming the system
        if (hasMoreRows) {
          await BatchProcessingUtil.delay(delayMs);
        }
      }

      this.loggingService.log(`Completed processing batch ${batchId}. Total rows processed: ${processedCount}`);
    } catch (error) {
      this.loggingService.error(`Error processing batch ${batchId}:`, error);
    }
  }

  /**
   * List upload batches with optional filters
   */
  async listBatches(options: {
    status?: string;
    page: number;
    limit: number;
    userId?: string;
  }): Promise<BasePagination<UploadBatch>> {
    const { items, total } = await this.uploadBatchesDao.listBatches(options);
    const totalPages = Math.ceil(total / options.limit);

    return {
      items,
      meta: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages,
      },
    };
  }

  /**
   * List batch rows with filters including email status
   */
  async listBatchRows(
    batchId: string,
    options: {
      email?: string;
      phone?: string;
      gender?: string;
      status?: RowStatus;
      type?: string;
      page: number;
      limit: number;
    }
  ): Promise<BasePagination<BatchRowWithEmailStatus>> {
    // Verify batch exists
    const batch = await this.uploadBatchesDao.findById(batchId);
    if (!batch) {
      throw new BadRequestException("Batch not found");
    }

    const { items, total } = await this.uploadBatchRowsDao.listBatchRows(batchId, options);
    const totalPages = Math.ceil(total / (options.limit < 1 ? 1 : options.limit));

    // Enhance rows with email status information including email log ID
    // Convert BatchRowWithEmailStatus back to UploadBatchRow for the enhancement method
    const uploadBatchRows = items.map(item => ({
      id: item.id,
      batch_id: item.batch_id,
      type: item.type,
      additional_data: item.additional_data,
      row_status: item.row_status,
      error_messages: item.error_messages,
      created_at: item.created_at,
      updated_at: item.updated_at,
      // Add other required UploadBatchRow properties if needed
    } as UploadBatchRow));
    
    const enhancedItems = await this.enhanceRowsWithEmailStatus(uploadBatchRows);

    return {
      items: enhancedItems,
      meta: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages,
      },
    };
  }

  /**
   * Process a single row
   */
  private async processSingleRow(row: UploadBatchRow): Promise<{ success: boolean; userId?: string }> {
    try {
      // Mark as in process
      await this.uploadBatchRowsDao.updateStatus(row.id, RowStatus.IN_PROCESS);

      // Type-safe access to additional_data based on row type
      const data = row.additional_data as CandidateRegistrationData;

      // Register candidate using the new service method
      const { user, password } = await this.usersService.registerCandidate({
        email: data.email,
        name: data.name,
        phone: data.phone,
        gender: data.gender as UserGender,
      });

      // Mark as valid and queue email
      await this.uploadBatchRowsDao.updateStatus(row.id, RowStatus.VALID);

      // Create email log and queue email with password
      await this.emailService.queueEmailForUser(user.id, user.email, EMAIL_TYPES.USER_CANDIDATE_BULK_DIRECT_REGISTRATION, password);

      return { success: true, userId: user.id };
    } catch (error) {
      this.loggingService.error(`Error processing row ${row.id}:`, error);

      // Mark as failed
      await this.uploadBatchRowsDao.updateStatus(row.id, RowStatus.FAILED, [
        error.message || "Unknown error",
      ]);

      return { success: false };
    }
  }

  private generateBatchRows(
    batch: UploadBatch,
    parsedRows: ParsedRow[],
    errors: { rowNumber: number; errors: string[]; data: Partial<ParsedRow> }[],
  ): any[] {
    this.loggingService.log("Creating batch rows...");

    // Create error map for O(1) lookup
    const errorMap = new Map<number, string[]>();
    errors.forEach(err => {
      if (!errorMap.has(err.rowNumber)) {
        errorMap.set(err.rowNumber, []);
      }
      errorMap.get(err.rowNumber)!.push(...err.errors);
    });

    return parsedRows.map((row) => {
      this.loggingService.log(`Processing row data ${JSON.stringify(row)}`);
      
      // Find errors for this row using Map lookup (O(1))
      const rowErrors = errorMap.get(row.rowNumber) || [];

      return {
        batch_id: batch.id,
        type: UPLOAD_BATCH_ROW_TYPES.CANDIDATE_REGISTRATION,
        additional_data: {
          email: row.email,
          name: row.name,
          phone: row.phone,
          gender: row.gender,
        },
        row_status: rowErrors.length > 0 ? RowStatus.INVALID : RowStatus.PENDING,
        error_messages: rowErrors.length > 0 ? rowErrors : null,
      };
    });

  }

  /**
   * Enhance batch rows with email status information including email log ID
   */
  private async enhanceRowsWithEmailStatus(rows: UploadBatchRow[]): Promise<BatchRowWithEmailStatus[]> {
    if (rows.length === 0) {
      return [];
    }

    // Extract unique emails from additional_data
    const emails = this.extractEmailsFromBatchRows(rows);
    if (emails.length === 0) {
      return rows.map(row => this.mapToBatchRowWithEmailStatus(row));
    }

    // Get email logs for these emails using EmailLogsDao
    const emailLogs = await this.emailLogsDao.getEmailLogsByEmails(emails, EMAIL_TYPES.USER_CANDIDATE_BULK_DIRECT_REGISTRATION);

    // Create email to email log mapping (latest email log per email)
    const emailLogMap = this.createEmailLogMap(emailLogs);

    // Enhance rows with email status including email log ID
    return rows.map(row => {
      const email = row.additional_data?.email;
      const emailLog = email ? emailLogMap.get(email.toLowerCase()) : undefined;

      return {
        ...this.mapToBatchRowWithEmailStatus(row),
        email_sent_status: emailLog?.email_sent_status,
        email_send_at: emailLog?.email_send_at,
        email_failed_reason: emailLog?.email_failed_reason,
        email_log_id: emailLog?.id,
      };
    });
  }

  /**
   * Map UploadBatchRow to BatchRowWithEmailStatus
   */
  private mapToBatchRowWithEmailStatus(row: UploadBatchRow): BatchRowWithEmailStatus {
    return {
      id: row.id,
      batch_id: row.batch_id,
      type: row.type,
      additional_data: row.additional_data,
      row_status: row.row_status,
      error_messages: row.error_messages,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Extract unique emails from batch rows
   */
  private extractEmailsFromBatchRows(rows: UploadBatchRow[]): string[] {
    const emails = new Set<string>();
    
    rows.forEach(row => {
      const email = row.additional_data?.email;
      if (email && typeof email === 'string') {
        emails.add(email.toLowerCase());
      }
    });

    return Array.from(emails);
  }

  /**
   * Create email to email log mapping (latest email log per email)
   */
  private createEmailLogMap(emailLogs: any[]): Map<string, any> {
    const emailLogMap = new Map<string, any>();
    
    emailLogs.forEach(log => {
      const email = log.email?.toLowerCase();
      if (email && !emailLogMap.has(email)) {
        emailLogMap.set(email, log);
      }
    });

    return emailLogMap;
  }
}
