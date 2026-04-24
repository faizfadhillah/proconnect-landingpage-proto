import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { Repository, IsNull, In } from "typeorm";
import { MstInformalCertificateMapping } from "./entities/mst_informal_certificate_mapping.entity";
import { MstLicense } from "../mst_licenses/entities/mst_license.entity";
import { UserCertificate } from "../user_certificates/entities/user_certificates.entity";
import { CreateInformalCertificateMappingDto } from "./dto/create-informal-certificate-mapping.dto";
import { UpdateInformalCertificateMappingDto } from "./dto/update-informal-certificate-mapping.dto";
import { UploadMappingResponseDto } from "./dto/upload-mapping.dto";
import { MstLicensesService } from "../mst_licenses/mst_licenses.service";
import { MstInformalCertificateMappingDao } from "./dao/mst_informal_certificate_mapping.dao";
import { InformalCertificateMappingStatus } from "./enums/informal-certificate-mapping-status.enum";
import { UserCertificatesService } from "../user_certificates/user_certificates.service";
import { UsersDao } from "../users/users.dao";
import { EncryptedUserDataService } from "../encrypted_user_data/encrypted_user_data.service";
import { LoggingService } from "../logs/logs.service";
import { INFORMAL_CERTIFICATE_PROCESSING_QUEUE } from "../common/queues/queue.constants";
import { extractLast4Digits } from "../utils/phone.util";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import { Response } from "express";
import { User } from "../users/entities/user.entity";
import { MstLicenseSkillMappingsService } from "../mst_license_skill_mappings/mst_license_skill_mappings.service";
import {
  LicenseVerificationResponseDto,
  LicenseVerificationStudentResponseDto,
  LicenseVerificationSummaryDto,
} from "./dto/license-verification-student-response.dto";
import { StudentLicenseResponseDto } from "../user_educations/dto/student-license-response.dto";
import { ApprovalState } from "../common/enums/approval-state.enum";
import { BasePagination } from "../base.pagination";
import { UserSkillsService } from "../user_skills/user_skills.service";

@Injectable()
export class MstInformalCertificateMappingsService {
  constructor(
    private readonly dao: MstInformalCertificateMappingDao,
    private readonly licensesService: MstLicensesService,
    @InjectRepository(MstInformalCertificateMapping)
    private mappingRepository: Repository<MstInformalCertificateMapping>,
    @InjectRepository(MstLicense)
    private licenseRepository: Repository<MstLicense>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserCertificate)
    private userCertificateRepository: Repository<UserCertificate>,
    private userCertificatesService: UserCertificatesService,
    private usersDao: UsersDao,
    private encryptedUserDataService: EncryptedUserDataService,
    private readonly logger: LoggingService,
    @InjectQueue(INFORMAL_CERTIFICATE_PROCESSING_QUEUE)
    private readonly informalCertificateProcessingQueue: Queue,
    private readonly mstLicenseSkillMappingsService: MstLicenseSkillMappingsService,
    private readonly userSkillsService: UserSkillsService,
  ) {}

  /**
   * Create informal certificate mapping
   */
  async create(
    dto: CreateInformalCertificateMappingDto,
  ): Promise<MstInformalCertificateMapping> {
    // 1. Validate license exists (DRY - reusable validation)
    await this.validateLicense(dto.license_id);

    // 2. At least one of email or phone must be provided
    if (!dto.email && !dto.phone) {
      throw new BadRequestException("Either email or phone must be provided");
    }

    // 3. Check duplicate - ensure unique combination
    const duplicate = await this.dao.findDuplicate(dto);
    if (duplicate) {
      throw new BadRequestException(
        "Mapping with this email/phone and license combination already exists",
      );
    }

    // 4. Create using DAO
    const saved = await this.dao.create(dto);

    // 5. Trigger processing via queue (async, don't block)
    await this.informalCertificateProcessingQueue.add(
      INFORMAL_CERTIFICATE_PROCESSING_QUEUE,
      {
        mappingId: saved.id,
      },
    );

    return saved;
  }

  /**
   * Validate license exists (DRY - reusable validation)
   */
  private async validateLicense(licenseId: string): Promise<void> {
    try {
      await this.licensesService.findOne(licenseId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`License with ID ${licenseId} not found`);
      }
      throw error;
    }
  }

  /**
   * Find one mapping by ID
   */
  async findOne(id: string): Promise<MstInformalCertificateMapping> {
    const mapping = await this.dao.findById(id);

    if (!mapping) {
      throw new NotFoundException(`Mapping with ID ${id} not found`);
    }

    return mapping;
  }

  /**
   * Update informal certificate mapping
   */
  async update(
    id: string,
    dto: UpdateInformalCertificateMappingDto,
  ): Promise<MstInformalCertificateMapping> {
    const existing = await this.findOne(id);

    // Cannot update if already PROCESSED
    if (existing.status === InformalCertificateMappingStatus.PROCESSED) {
      throw new BadRequestException("Cannot update processed mapping");
    }

    // Validate license if changed (DRY - reuse validation)
    if (dto.license_id) {
      await this.validateLicense(dto.license_id);
    }

    // Validate at least one of email/phone if both are being cleared
    const finalEmail = dto.email !== undefined ? dto.email : existing.email;
    const finalPhone = dto.phone !== undefined ? dto.phone : existing.phone;
    const finalName = dto.name !== undefined ? dto.name : existing.name;
    const finalPhotoUrl =
      dto.photo_url !== undefined ? dto.photo_url : existing.photo_url;
    const finalLicenseId = dto.license_id || existing.license_id;

    if (!finalEmail && !finalPhone) {
      throw new BadRequestException("Either email or phone must be provided");
    }

    // Check duplicate if email, phone, or license_id changed
    if (dto.email !== undefined || dto.phone !== undefined || dto.license_id) {
      const checkDto: CreateInformalCertificateMappingDto = {
        email: finalEmail || undefined,
        phone: finalPhone || undefined,
        name: finalName || undefined,
        photo_url: finalPhotoUrl || undefined,
        license_id: finalLicenseId,
      };
      const duplicate = await this.dao.findDuplicate(checkDto, id);
      if (duplicate) {
        throw new BadRequestException(
          "Mapping with this email/phone and license combination already exists",
        );
      }
    }

    // Update using DAO
    const updated = await this.dao.update(id, dto);

    // Trigger processing via queue if status is still UNPROCESSED (async, don't block)
    // This ensures that if email/phone/license_id changed, the mapping will be re-processed
    if (updated.status === InformalCertificateMappingStatus.UNPROCESSED) {
      await this.informalCertificateProcessingQueue.add(
        INFORMAL_CERTIFICATE_PROCESSING_QUEUE,
        {
          mappingId: updated.id,
        },
      );
    }

    return updated;
  }

  /**
   * Delete informal certificate mapping (soft delete)
   */
  async remove(id: string): Promise<void> {
    const mapping = await this.findOne(id);

    // Cannot delete if already PROCESSED
    if (mapping.status === InformalCertificateMappingStatus.PROCESSED) {
      throw new BadRequestException("Cannot delete processed mapping");
    }

    await this.dao.softDelete(id);
  }

  /**
   * Find unprocessed mappings for a user (used in Phase 5 candidate registration trigger)
   */
  async findUnprocessedByEmailOrPhone(
    email?: string,
    phone?: string,
  ): Promise<MstInformalCertificateMapping[]> {
    return await this.dao.findUnprocessedByEmailOrPhone(email, phone);
  }

  /**
   * Process informal certificates for a specific user
   * More efficient than processMapping() as it only processes mappings for one user without getting all users
   * @param userId - User ID to process
   * @param email - User email (optional, will be fetched if not provided)
   * @param phone - User phone (optional, will be decrypted if not provided)
   */
  async processMappingsForUser(
    userId: string,
    email?: string,
    phone?: string,
  ): Promise<void> {
    // Get user if email not provided
    let userEmail = email;
    if (!userEmail) {
      const user = await this.usersDao.findOneActive(userId);
      if (!user) {
        this.logger.warn(
          `User ${userId} not found for informal certificate processing`,
          "informal_certificate_processing",
          { userId },
        );
        return;
      }
      userEmail = user.email || undefined;
    }

    // Get decrypted phone if not provided
    let decryptedPhone = phone;
    if (!decryptedPhone) {
      try {
        const encryptedData =
          await this.encryptedUserDataService.findOneDecrypted(userId);
        decryptedPhone = encryptedData?.encrypted_phone || undefined;
      } catch (error) {
        this.logger.warn(
          `Could not retrieve encrypted phone for user ${userId}`,
          "informal_certificate_processing",
          { error: error?.message || String(error), userId },
        );
      }
    }

    if (!userEmail && !decryptedPhone) {
      return; // No contact info to match
    }

    // Find unprocessed mappings for this user
    const mappings = await this.dao.findUnprocessedByEmailOrPhone(
      userEmail,
      decryptedPhone,
    );

    if (mappings.length === 0) {
      return; // No mappings found
    }

    // Process each mapping - directly grant license to this user (no need to find matching users)
    // Note: mappings from findUnprocessedByEmailOrPhone already match this user's email/phone
    for (const mapping of mappings) {
      try {
        await this.grantLicenseFromMapping(userId, mapping);
      } catch (error) {
        this.logger.error(
          `Error processing informal certificate mapping ${mapping.id} for user ${userId}`,
          "informal_certificate_processing",
          error?.stack || error?.message || String(error),
          {
            error: error?.message || String(error),
            mappingId: mapping.id,
            userId,
          },
        );
      }
    }
  }

  /**
   * Grant license to user from mapping and mark mapping as processed (DRY - reusable method)
   * @param userId - User ID to grant license to
   * @param mapping - Informal certificate mapping
   */
  private async grantLicenseFromMapping(
    userId: string,
    mapping: MstInformalCertificateMapping,
  ): Promise<void> {
    // Get license details
    const license = await this.licensesService.findOne(mapping.license_id);

    // Grant certificate to user (DRY - use centralized method)
    await this.userCertificatesService.grantVerifiedLicense(
      userId,
      mapping.license_id,
      license,
      "Granted via informal certificate mapping",
    );

    // Mark mapping as processed
    if (mapping.status !== InformalCertificateMappingStatus.PROCESSED) {
      mapping.status = InformalCertificateMappingStatus.PROCESSED;
      await this.mappingRepository.save(mapping);
    }
  }

  /**
   * Process informal certificate mapping - find matching users and grant licenses
   * Used by: Admin upload/update trigger, Candidate registration trigger
   */
  async processMapping(mappingId: string): Promise<void> {
    const mapping = await this.findOne(mappingId);

    if (mapping.status === InformalCertificateMappingStatus.PROCESSED) {
      return; // Already processed
    }

    // Find matching users
    // Filter at DB layer using email or phone_last_4_digits to narrow down candidates
    // Then decrypt and match exactly for phone (since phone_last_4_digits is only for narrowing)

    // Extract last 4 digits from mapping phone if exists
    const phoneLast4Digits = mapping.phone
      ? extractLast4Digits(mapping.phone)
      : null;

    // Filter users at DB layer using email or phone_last_4_digits
    const filteredUsers = await this.usersDao.findByEmailOrPhoneLast4Digits(
      mapping.email,
      phoneLast4Digits,
    );

    // Get encrypted data only for filtered candidates
    const userIds = filteredUsers.map((user) => user.id);
    const decryptedDataMap =
      await this.encryptedUserDataService.findBulkDecrypted(userIds);

    // Filter users at app level for exact match
    const matchingUsers: any[] = [];
    for (const user of filteredUsers) {
      try {
        // Check email match first (more efficient, no need to decrypt)
        if (mapping.email && user.email === mapping.email) {
          matchingUsers.push(user);
          continue; // Skip phone check if email already matches
        }

        // Check phone match (use pre-fetched decrypted data)
        if (mapping.phone) {
          const encryptedData = decryptedDataMap.get(user.id);
          const decryptedPhone = encryptedData?.encrypted_phone;
          if (decryptedPhone === mapping.phone) {
            matchingUsers.push(user);
          }
        }
      } catch (error) {
        // Skip user if can't decrypt phone
        this.logger.warn(
          `Could not decrypt phone for user ${user.id} during mapping`,
          "informal_certificate_processing",
          {
            error: error?.message || String(error),
            userId: user.id,
            mappingId: mapping.id,
          },
        );
      }
    }

    if (matchingUsers.length === 0) {
      this.logger.log(
        "No matching users found for this mapping",
        "informal_certificate_processing",
        {
          mappingId: mapping.id,
          email: mapping.email,
          phone: mapping.phone,
          licenseId: mapping.license_id,
        },
      );
      return; // Keep status as UNPROCESSED
    }

    // Grant certificate to each matching user (DRY - use shared method)
    for (const user of matchingUsers) {
      try {
        await this.grantLicenseFromMapping(user.id, mapping);
      } catch (error) {
        this.logger.error(
          `Error granting certificate to user ${user.id}`,
          "informal_certificate_processing",
          error?.stack || error?.message || String(error),
          {
            error: error?.message || String(error),
            userId: user.id,
            mappingId: mapping.id,
            licenseId: mapping.license_id,
          },
        );
      }
    }
  }

  /**
   * Download Excel template for bulk upload
   */
  async downloadTemplate(res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();

    // Main sheet
    const worksheet = workbook.addWorksheet("Informal Certificate Mapping");

    worksheet.columns = [
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Name", key: "name", width: 30 },
      { header: "Photo URL", key: "photo_url", width: 40 },
      { header: "License ID", key: "license_id", width: 40 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    worksheet.addRow({
      email: "user@example.com (optional if phone provided)",
      phone: "+6281234567890 (optional if email provided)",
      name: "John Doe (required)",
      photo_url: "https://example.com/photo.jpg (optional)",
      license_id: "Please refer to 'MASTER' sheet for License IDs",
    });

    // MASTER sheet
    const masterSheet = workbook.addWorksheet("MASTER");

    // Fetch all licenses
    const licenses = await this.licenseRepository.find({
      where: { deleted_at: IsNull() },
      order: { license_name: "ASC" },
    });

    // Licenses section
    masterSheet.addRow(["LICENSES"]);
    masterSheet.addRow([
      "License ID",
      "License Code",
      "License Name",
      "Issuing Organization",
    ]);

    const licenseHeaderRow = masterSheet.getRow(masterSheet.rowCount);
    licenseHeaderRow.font = { bold: true };
    licenseHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    for (const license of licenses) {
      masterSheet.addRow([
        license.id,
        license.license_template_code || "",
        license.license_name,
        license.issuing_organization || "",
      ]);
    }

    // Set column widths for MASTER sheet
    masterSheet.getColumn(1).width = 40; // License ID
    masterSheet.getColumn(2).width = 30; // License Code
    masterSheet.getColumn(3).width = 40; // License Name
    masterSheet.getColumn(4).width = 40; // Issuing Organization

    // Freeze header rows
    masterSheet.views = [{ state: "frozen", ySplit: 2 }];

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=informal_certificate_mapping_template.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Helper: Extract cell value from ExcelJS cell, handling hyperlinks and objects
   * ExcelJS cells with hyperlinks return objects like { text: 'value', hyperlink: 'url' }
   */
  private extractCellValue(cell: ExcelJS.Cell): string {
    if (!cell || cell.value === null || cell.value === undefined) {
      return "";
    }

    const value = cell.value;

    // If it's already a string, return it
    if (typeof value === "string") {
      return value;
    }

    // If it's a number, boolean, or Date, convert to string
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    // If it's an object (common for hyperlink cells)
    if (typeof value === "object" && value !== null) {
      // ExcelJS hyperlink cells have 'text' property that contains the display text
      // Type guard: check if it's a CellHyperlinkValue
      if ("text" in value && typeof (value as any).text === "string") {
        return String((value as any).text);
      }
      // Some cells might have 'richText' array (CellRichTextValue)
      if ("richText" in value && Array.isArray((value as any).richText)) {
        return (value as any).richText.map((rt: any) => rt.text || "").join("");
      }
      // If object has toString method, use it
      if (typeof value.toString === "function") {
        try {
          return value.toString();
        } catch {
          // If toString fails, fall through to String conversion
        }
      }
      // Last resort: try String conversion
      // For hyperlink objects, we should have caught it with .text above
      return String(value);
    }

    // Fallback: convert to string
    return String(value);
  }

  /**
   * Process a single row from Excel upload (DRY - reusable logic)
   */
  private async processMappingRow(
    row: ExcelJS.Row,
    rowNumber: number,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Use getCell() to properly handle hyperlinks and cell objects
      // Column indices are 1-based: A=1, B=2, C=3, D=4, E=5
      // Template order: Email (A), Phone (B), Name (C), Photo URL (D), License ID (E)
      const emailCell = row.getCell(1); // Column A
      const phoneCell = row.getCell(2); // Column B
      const nameCell = row.getCell(3); // Column C
      const photoUrlCell = row.getCell(4); // Column D
      const licenseIdCell = row.getCell(5); // Column E

      const email = this.extractCellValue(emailCell)?.trim() || null;
      const phone = this.extractCellValue(phoneCell)?.trim() || null;
      const name = this.extractCellValue(nameCell)?.trim();
      const photoUrl = this.extractCellValue(photoUrlCell)?.trim() || null;
      const licenseId = this.extractCellValue(licenseIdCell)?.trim();

      // Validate required fields
      if (!name) {
        throw new Error("Missing name");
      }

      if (!licenseId) {
        throw new Error("Missing license_id");
      }

      // Validate at least one of email/phone
      if (!email && !phone) {
        throw new Error("Either email or phone must be provided");
      }

      const dto: CreateInformalCertificateMappingDto = {
        email: email || undefined,
        phone: phone || undefined,
        name: name,
        photo_url: photoUrl || undefined,
        license_id: licenseId,
      };

      // Reuse existing validation and creation logic (DRY)
      await this.validateLicense(dto.license_id);

      // Create mapping
      await this.create(dto);

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return { success: false, error: `Row ${rowNumber}: ${errorMessage}` };
    }
  }

  /**
   * Upload and process Excel file with mappings
   */
  async uploadMappings(
    file: Express.Multer.File,
  ): Promise<UploadMappingResponseDto> {
    const result: UploadMappingResponseDto = {
      success_count: 0,
      error_count: 0,
      errors: [],
      message: "",
    };

    if (!file) {
      throw new BadRequestException("File not found");
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(file.path);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException("Worksheet not found in Excel file");
      }

      const rowPromises: Promise<void>[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const processRow = async () => {
          const rowResult = await this.processMappingRow(row, rowNumber);

          if (rowResult.success) {
            result.success_count++;
          } else {
            result.error_count++;
            if (rowResult.error) {
              result.errors.push(rowResult.error);
            }
          }
        };

        rowPromises.push(processRow());
      });

      // Wait for all rows to be processed
      await Promise.all(rowPromises);

      // Clean up uploaded file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      result.message = `Processing complete. Success: ${result.success_count}, Errors: ${result.error_count}`;

      return result;
    } catch (error) {
      // Clean up file on error
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Error processing file: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get students with licenses for license verification dashboard
   * Returns all users who have certificates, grouped by user with their licenses and skills
   */
  async getStudentsWithLicenses(
    filters?: {
      name?: string;
      email?: string;
      phone?: string;
      license_id?: string;
      status?: "ALL" | "VERIFIED" | "PENDING";
    },
    page: number = 1,
    limit: number = 10,
  ): Promise<
    BasePagination<LicenseVerificationStudentResponseDto> & {
      summary: LicenseVerificationSummaryDto;
    }
  > {
    this.logger.log(
      `Getting students with licenses - page: ${page}, limit: ${limit}, filters: ${JSON.stringify(filters)}`,
      "license_verification",
      { page, limit, filters },
    );

    // Build base query to get distinct user IDs with certificates
    // First, get distinct user IDs only (more efficient)
    const userIdsQuery = this.userRepository
      .createQueryBuilder("user")
      .innerJoin(
        "user.userCertificates",
        "certificate",
        "certificate.deleted_at IS NULL",
      )
      .where("user.deleted_at IS NULL")
      .select("user.id", "id")
      .distinct(true);

    // Apply filters to userIdsQuery
    if (filters?.name) {
      userIdsQuery.andWhere("user.full_name ILIKE :name", {
        name: `%${filters.name}%`,
      });
    }
    if (filters?.email) {
      userIdsQuery.andWhere("user.email ILIKE :email", {
        email: `%${filters.email}%`,
      });
    }
    if (filters?.license_id) {
      userIdsQuery.andWhere("certificate.mst_license_id = :licenseId", {
        licenseId: filters.license_id,
      });
    }

    // Get total count first (before pagination) - clone the query with filters
    const totalCountQuery = userIdsQuery.clone();
    const total = await totalCountQuery
      .select("COUNT(DISTINCT user.id)", "count")
      .getRawOne()
      .then((result) => parseInt(result?.count || "0", 10))
      .catch((error) => {
        this.logger.error(
          "Error counting total users",
          "license_verification",
          error?.stack || error?.message || String(error),
          { error: error?.message || String(error) },
        );
        return 0;
      });

    this.logger.log(
      `Total users with certificates: ${total}`,
      "license_verification",
      { total },
    );

    // Apply pagination to get user IDs for current page
    const offset = (page - 1) * limit;
    const userResults = await userIdsQuery
      .skip(offset)
      .take(limit)
      .getRawMany()
      .catch((error) => {
        this.logger.error(
          "Error fetching user IDs",
          "license_verification",
          error?.stack || error?.message || String(error),
          { error: error?.message || String(error) },
        );
        return [];
      });
    const userIds = userResults.map((r) => r.id);

    this.logger.log(
      `Found ${userIds.length} users for page ${page}`,
      "license_verification",
      { userIdsCount: userIds.length, page },
    );

    if (userIds.length === 0) {
      return {
        items: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
        summary: {
          total_students: 0,
          verified_licenses: 0,
          pending_licenses: 0,
          showing_students: 0,
        },
      };
    }

    // Get full user entities
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
    });

    // Get all certificates for these users (grouped by user)
    const certificatesByUser =
      await this.userCertificatesService.findByUserIds(userIds);

    // Get all unique license IDs
    const licenseIds = new Set<string>();
    for (const certs of certificatesByUser.values()) {
      for (const cert of certs) {
        if (cert.mst_license_id) {
          licenseIds.add(cert.mst_license_id);
        }
      }
    }

    // Get skills for all licenses
    const skillsByLicenseId =
      licenseIds.size > 0
        ? await this.mstLicenseSkillMappingsService.findSkillsByLicenseIds(
            Array.from(licenseIds),
          )
        : new Map<string, string[]>();

    // Get decrypted phone numbers
    const decryptedPhoneMap =
      userIds.length > 0
        ? await this.encryptedUserDataService.findBulkDecrypted(userIds)
        : new Map();

    // Calculate summary statistics using optimized queries (count only, no data fetch)
    // Run summary queries in parallel for better performance
    const summaryPromises = Promise.all([
      // Count verified certificates
      this.userCertificateRepository.count({
        where: {
          is_verified: true,
          deleted_at: IsNull(),
        },
      }),
      // Count pending certificates
      this.userCertificateRepository.count({
        where: {
          approval_state: ApprovalState.WAITING_APPROVAL,
          deleted_at: IsNull(),
        },
      }),
      // Count distinct users with certificates using optimized query
      this.userRepository
        .createQueryBuilder("user")
        .innerJoin(
          "user.userCertificates",
          "certificate",
          "certificate.deleted_at IS NULL",
        )
        .where("user.deleted_at IS NULL")
        .select("COUNT(DISTINCT user.id)", "count")
        .getRawOne()
        .then((result) => parseInt(result?.count || "0", 10))
        .catch((error) => {
          this.logger.error(
            "Error counting total users with certificates",
            "license_verification",
            error?.stack || error?.message || String(error),
            { error: error?.message || String(error) },
          );
          return 0;
        }),
    ]);

    const [allVerifiedCount, allPendingCount, totalUsersWithCertificates] =
      await summaryPromises;

    // Build response
    const students: LicenseVerificationStudentResponseDto[] = [];

    for (const user of users) {
      const certificates = certificatesByUser.get(user.id) || [];

      // Filter by status if provided
      let filteredCertificates = certificates;
      if (filters?.status) {
        if (filters.status === "VERIFIED") {
          filteredCertificates = certificates.filter(
            (c) => c.is_verified === true,
          );
        } else if (filters.status === "PENDING") {
          filteredCertificates = certificates.filter(
            (c) => c.approval_state === ApprovalState.WAITING_APPROVAL,
          );
        }
      }

      // Skip user if no certificates match filter
      if (
        filteredCertificates.length === 0 &&
        filters?.status &&
        filters.status !== "ALL"
      ) {
        continue;
      }

      // Build license DTOs with skills
      const licenseDtos: StudentLicenseResponseDto[] = filteredCertificates.map(
        (cert) => {
          const skills = cert.mst_license_id
            ? skillsByLicenseId.get(cert.mst_license_id) || []
            : [];
          return StudentLicenseResponseDto.fromCertificate(cert, skills);
        },
      );

      // Get decrypted phone
      const decrypted = decryptedPhoneMap.get(user.id);
      const phone = decrypted?.encrypted_phone || null;

      students.push({
        user_id: user.id,
        full_name: user.full_name || null,
        photo_url: user.photo_url || null,
        email: user.email || null,
        phone: phone || null,
        total_licenses: licenseDtos.length,
        licenses: licenseDtos,
      });
    }

    // Calculate summary
    const summary: LicenseVerificationSummaryDto = {
      total_students: totalUsersWithCertificates,
      verified_licenses: allVerifiedCount,
      pending_licenses: allPendingCount,
      showing_students: students.length,
    };

    // Calculate pagination
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return {
      items: students,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      summary,
    };
  }

  // Excel export feature temporarily disabled
  // /**
  //  * Export students with licenses to Excel
  //  */
  // private async exportStudentsToExcel(
  //   students: LicenseVerificationStudentResponseDto[],
  // ): Promise<Buffer> {
  //   const workbook = new ExcelJS.Workbook();
  //   const worksheet = workbook.addWorksheet("License Verification Students");

  //   // Define columns
  //   worksheet.columns = [
  //     { header: "Student Name", key: "full_name", width: 30 },
  //     { header: "Email", key: "email", width: 30 },
  //     { header: "Phone", key: "phone", width: 20 },
  //     { header: "Total Licenses", key: "total_licenses", width: 15 },
  //     { header: "License Name", key: "license_name", width: 40 },
  //     { header: "License ID", key: "license_id", width: 30 },
  //     { header: "Status", key: "status", width: 20 },
  //     { header: "Skills", key: "skills", width: 50 },
  //   ];

  //   // Style header row
  //   worksheet.getRow(1).font = { bold: true };
  //   worksheet.getRow(1).fill = {
  //     type: "pattern",
  //     pattern: "solid",
  //     fgColor: { argb: "FFD3D3D3" },
  //   };

  //   // Add data rows
  //   for (const student of students) {
  //     if (student.licenses && student.licenses.length > 0) {
  //       for (const license of student.licenses) {
  //         worksheet.addRow({
  //           full_name: student.full_name || "",
  //           email: student.email || "",
  //           phone: student.phone || "",
  //           total_licenses: student.total_licenses,
  //           license_name: license.license_name || "",
  //           license_id: license.license_number || license.mst_license_id || "",
  //           status: license.is_verified
  //             ? "Verified"
  //             : license.approval_state === "WAITING_APPROVAL"
  //               ? "Pending"
  //               : license.approval_state === "REJECT"
  //                 ? "Rejected"
  //                 : "Unknown",
  //           skills: (license.skills || []).join(", "),
  //         });
  //       }
  //     } else {
  //       // Student with no licenses
  //       worksheet.addRow({
  //         full_name: student.full_name || "",
  //         email: student.email || "",
  //         phone: student.phone || "",
  //         total_licenses: 0,
  //         license_name: "",
  //         license_id: "",
  //         status: "",
  //         skills: "",
  //       });
  //     }
  //   }

  //   // Write to buffer
  //   const buffer = await workbook.xlsx.writeBuffer();
  //   return Buffer.from(buffer);
  // }

  /**
   * Approve or reject certificate verification (Admin only)
   */
  async approveCertificate(
    id: string,
    approvalState: ApprovalState,
    approvalBy: string,
  ): Promise<UserCertificate> {
    const certificate = await this.userCertificateRepository.findOne({
      where: { id },
    });
    if (!certificate) {
      throw new NotFoundException(`UserCertificate with ID ${id} not found`);
    }

    // Validate: allow changes between APPROVED and REJECT (unverify/verify)
    // Only prevent if trying to change to the same state
    if (certificate.approval_state === approvalState) {
      throw new BadRequestException(
        `UserCertificate with ID ${id} is already in state: ${approvalState}`,
      );
    }

    // Allow transitions:
    // - WAITING_APPROVAL -> APPROVED (verify)
    // - WAITING_APPROVAL -> REJECT (reject)
    // - APPROVED -> REJECT (unverify)
    // - REJECT -> APPROVED (re-verify)
    const previousState = certificate.approval_state;
    certificate.approval_state = approvalState;
    certificate.approval_by = approvalBy;
    certificate.is_verified = approvalState === ApprovalState.APPROVED;

    const updated = await this.userCertificateRepository.save(certificate);

    // Trigger queue if changing to APPROVED (from WAITING_APPROVAL or REJECT)
    if (
      approvalState === ApprovalState.APPROVED &&
      previousState !== ApprovalState.APPROVED
    ) {
      // Process certificate verification to grant skills
      await this.userCertificatesService.processCertificateVerificationById(
        updated.id,
      );
    }

    // If unverifying (APPROVED -> REJECT), revoke skills
    if (
      approvalState === ApprovalState.REJECT &&
      previousState === ApprovalState.APPROVED
    ) {
      await this.revokeSkillsByCertificateId(updated.id, approvalBy);
    }

    return updated;
  }

  /**
   * Revoke skills when certificate is rejected
   * Called when certificate approval_state changes from APPROVED to REJECT
   */
  private async revokeSkillsByCertificateId(
    certificateId: string,
    approvalBy: string,
  ): Promise<void> {
    this.logger.log(
      `Revoking skills for certificate ${certificateId}`,
      "revoke_certificate_skills",
      { certificateId, approvalBy },
    );

    // 1. Find certificate
    const certificate = await this.userCertificateRepository.findOne({
      where: { id: certificateId },
    });

    if (!certificate || !certificate.mst_license_id || !certificate.user_id) {
      this.logger.log(
        `Certificate ${certificateId} not found or missing license/user info`,
        "revoke_certificate_skills",
        { certificateId },
      );
      return;
    }

    // 2. Find license-skill mappings
    const mappings = await this.mstLicenseSkillMappingsService.findByLicenseId(
      certificate.mst_license_id,
    );

    if (mappings.length === 0) {
      this.logger.log(
        `No skill mappings found for license ${certificate.mst_license_id}`,
        "revoke_certificate_skills",
        { certificateId, licenseId: certificate.mst_license_id },
      );
      return;
    }

    // 3. Revoke skills
    for (const mapping of mappings) {
      try {
        const revokedSkill = await this.userSkillsService.revokeVerifiedSkill(
          certificate.user_id,
          mapping.skill_id,
          approvalBy,
        );

        if (revokedSkill) {
          this.logger.log(
            `Revoked skill ${mapping.skill_id} for user ${certificate.user_id} (via certificate ${certificateId})`,
            "revoke_certificate_skills",
            {
              skillId: mapping.skill_id,
              userId: certificate.user_id,
              certificateId,
            },
          );
        }
      } catch (error) {
        this.logger.error(
          `Error revoking skill ${mapping.skill_id} for user ${certificate.user_id}`,
          "revoke_certificate_skills",
          error?.stack || error?.message || String(error),
          {
            error: error?.message || String(error),
            skillId: mapping.skill_id,
            userId: certificate.user_id,
            certificateId,
          },
        );
        // Continue with other skills
      }
    }
  }
}
