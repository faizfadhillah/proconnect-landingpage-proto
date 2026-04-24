import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { MstLicenseSkillMapping } from "./entities/mst_license_skill_mapping.entity";
import { UserCertificate } from "../user_certificates/entities/user_certificates.entity";
import { MstLicense } from "../mst_licenses/entities/mst_license.entity";
import { MstSkill } from "../mst_skills/entities/mst_skill.entity";
import { CreateLicenseSkillMappingDto } from "./dto/create-license-skill-mapping.dto";
import { UpdateLicenseSkillMappingDto } from "./dto/update-license-skill-mapping.dto";
import { UploadLicenseSkillMappingResponseDto } from "./dto/upload-license-skill-mapping.dto";
import { MstLicensesService } from "../mst_licenses/mst_licenses.service";
import { MstSkillsService } from "../mst_skills/mst_skills.service";
import { UserSkillsService } from "../user_skills/user_skills.service";
import { LoggingService } from "../logs/logs.service";
import { MstLicenseSkillMappingDao } from "./dao/mst_license_skill_mapping.dao";
import { RetroactiveLicenseSkillQueuePublisher } from "../queues/publishers/retroactive-license-skill-queue.publisher";
import { GroupedLicenseSkillResponseDto } from "./dto/grouped-license-skill-response.dto";
import { BasePagination } from "../base.pagination";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import { Response } from "express";
import { ApprovalState } from "../common/enums/approval-state.enum";

@Injectable()
export class MstLicenseSkillMappingsService {
  constructor(
    private readonly dao: MstLicenseSkillMappingDao,
    @InjectRepository(UserCertificate)
    private userCertificateRepository: Repository<UserCertificate>,
    @InjectRepository(MstLicense)
    private licenseRepository: Repository<MstLicense>,
    @InjectRepository(MstSkill)
    private skillRepository: Repository<MstSkill>,
    private readonly licensesService: MstLicensesService,
    private readonly skillsService: MstSkillsService,
    private readonly userSkillsService: UserSkillsService,
    private readonly logger: LoggingService,
    private readonly retroactiveLicenseSkillQueuePublisher: RetroactiveLicenseSkillQueuePublisher,
  ) {}

  /**
   * Create license skill mapping
   */
  async create(dto: CreateLicenseSkillMappingDto): Promise<MstLicenseSkillMapping> {
    // 1. Validate FKs exist
    await this.validateForeignKeys(dto);

    // 2. Check duplicate
    const duplicate = await this.dao.findDuplicate(dto);
    if (duplicate) {
      throw new BadRequestException("Mapping with this license and skill combination already exists");
    }

    // 3. Create using DAO
    const saved = await this.dao.create(dto);

    // 4. Trigger retroactive processing via queue
    await this.retroactiveLicenseSkillQueuePublisher.publishMappingJob(saved.id);

    return saved;
  }

  /**
   * Validate all foreign keys exist (DRY - reusable validation)
   */
  private async validateForeignKeys(dto: CreateLicenseSkillMappingDto): Promise<void> {
    // Check license exists
    try {
      await this.licensesService.findOne(dto.license_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`License with ID ${dto.license_id} not found`);
      }
      throw error;
    }

    // Check skill exists
    try {
      await this.skillsService.findOne(dto.skill_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Skill with ID ${dto.skill_id} not found`);
      }
      throw error;
    }
  }

  /**
   * Update license skill mapping
   */
  async update(
    id: string,
    dto: UpdateLicenseSkillMappingDto
  ): Promise<MstLicenseSkillMapping> {
    const existing = await this.findOne(id);
    
    // Validate FKs if changed
    if (dto.license_id || dto.skill_id) {
      const validationDto: CreateLicenseSkillMappingDto = {
        license_id: dto.license_id || existing.license_id,
        skill_id: dto.skill_id || existing.skill_id,
      };
      await this.validateForeignKeys(validationDto);
      
      // Check duplicate if license_id or skill_id changed
      const duplicate = await this.dao.findDuplicate(validationDto);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException("Mapping with this license and skill combination already exists");
      }
    }
    
    // Update using DAO
    const updated = await this.dao.update(id, dto);

    // If license_id or skill_id changed, trigger retroactive processing
    if (dto.license_id || dto.skill_id) {
      await this.retroactiveLicenseSkillQueuePublisher.publishMappingJob(updated.id);
    }

    return updated;
  }

  /**
   * Delete license skill mapping (soft delete)
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify exists
    await this.dao.softDelete(id);
  }

  /**
   * Find one mapping by ID
   */
  async findOne(id: string): Promise<MstLicenseSkillMapping> {
    const mapping = await this.dao.findById(id);
    
    if (!mapping) {
      throw new NotFoundException(`Mapping with ID ${id} not found`);
    }
    
    return mapping;
  }

  /**
   * Find mappings by license ID
   */
  async findByLicenseId(licenseId: string): Promise<MstLicenseSkillMapping[]> {
    return await this.dao.findByLicenseId(licenseId);
  }

  /**
   * Process retroactive mappings - find all verified certificates with this license and grant skills
   */
  async processRetroactiveMappings(mappingId: string): Promise<{
    processed_count: number;
    errors: string[];
  }> {
    const mapping = await this.findOne(mappingId);
    
    const result = {
      processed_count: 0,
      errors: [],
    };

    // Find all verified certificates that have this license
    const matchingCertificates = await this.findVerifiedCertificatesWithLicense(
      mapping.license_id
    );

    this.logger.log(
      `Found ${matchingCertificates.length} verified certificates with license ${mapping.license_id} for retroactive processing`,
      'retroactive_processing',
      { mappingId: mapping.id, licenseId: mapping.license_id, skillId: mapping.skill_id, count: matchingCertificates.length }
    );

    for (const certificate of matchingCertificates) {
      try {
        await this.userSkillsService.grantVerifiedSkill(
          certificate.user_id,
          mapping.skill_id
        );
        result.processed_count++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(
          `User ${certificate.user_id}: ${errorMessage}`
        );
        this.logger.error(
          `Error granting skill retroactively to user ${certificate.user_id}`,
          'retroactive_processing',
          error?.stack || error?.message || String(error),
          {
            error: errorMessage,
            userId: certificate.user_id,
            certificateId: certificate.id,
            mappingId: mapping.id,
            licenseId: mapping.license_id,
            skillId: mapping.skill_id,
          }
        );
      }
    }

    this.logger.log(
      `Retroactive processing completed for mapping ${mappingId}`,
      'retroactive_processing',
      { mappingId: mapping.id, processed_count: result.processed_count, error_count: result.errors.length }
    );

    return result;
  }

  /**
   * Find all verified certificates that have this license
   */
  private async findVerifiedCertificatesWithLicense(
    licenseId: string
  ): Promise<UserCertificate[]> {
    return await this.userCertificateRepository.find({
      where: {
        mst_license_id: licenseId,
        approval_state: ApprovalState.APPROVED,
        deleted_at: IsNull(),
      },
    });
  }

  /**
   * Process retroactive license-skill mapping for specific skill and user
   * Check if user has verified certificates that should grant this specific skill
   * Used when user creates a skill - check if certificate should have already granted this skill
   */
  async processRetroactiveCertificateForSkill(
    userId: string,
    skillId: string
  ): Promise<void> {
    // Find all verified certificates for user that have mst_license_id
    const verifiedCertificates = await this.userCertificateRepository.find({
      where: {
        user_id: userId,
        approval_state: ApprovalState.APPROVED,
        deleted_at: IsNull(),
      },
    });

    // Filter certificates that have mst_license_id
    const certificatesWithLicense = verifiedCertificates.filter(
      cert => cert.mst_license_id !== null
    );

    if (certificatesWithLicense.length === 0) {
      this.logger.log(
        `No verified certificates with license found for user ${userId}`,
        'retroactive_processing',
        { userId, skillId }
      );
      return;
    }

    // For each certificate, find matching mapping for this specific skill
    for (const certificate of certificatesWithLicense) {
      try {
        if (!certificate.mst_license_id) {
          continue;
        }

        // Find license-skill mapping for this certificate's license and specific skill
        const matchingMapping = await this.dao.findByLicenseIdAndSkillId(
          certificate.mst_license_id,
          skillId
        );

        if (matchingMapping) {
          // Grant this specific skill
          await this.userSkillsService.grantVerifiedSkill(
            userId,
            skillId
          );
          
          this.logger.log(
            `Granted skill ${skillId} to user ${userId} retroactively from certificate ${certificate.id}`,
            'retroactive_processing',
            { userId, skillId, certificateId: certificate.id, licenseId: certificate.mst_license_id }
          );
          // Only need to grant once, break after first match
          break;
        }
      } catch (error) {
        this.logger.error(
          `Error processing retroactive certificate for skill ${skillId} and user ${userId}`,
          'retroactive_processing',
          error?.stack || error?.message || String(error),
          {
            error: error instanceof Error ? error.message : String(error),
            userId,
            skillId,
            certificateId: certificate.id,
          }
        );
        // Continue with other certificates
      }
    }
  }

  /**
   * Download Excel template for bulk upload (prepopulated with current data + ID column)
   */
  async downloadTemplate(res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Data (ID + mapping columns, prepopulated)
    const worksheet = workbook.addWorksheet("License Skill Mapping");
    worksheet.columns = [
      { header: "ID", key: "id", width: 40 },
      { header: "License ID", key: "license_id", width: 40 },
      { header: "Skill ID", key: "skill_id", width: 40 },
    ];
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
    const mappings = await this.dao.findAllActive();
    for (const m of mappings) {
      worksheet.addRow({
        id: m.id,
        license_id: m.license_id,
        skill_id: m.skill_id,
      });
    }

    // Sheet 2: NOTES for end user
    const notesSheet = workbook.addWorksheet("NOTES");
    notesSheet.addRow(["Panduan upload:"]);
    notesSheet.addRow(["- Kolom ID: Jika kosong = insert baru. Jika terisi = update data yang ada."]);
    notesSheet.addRow(["- Referensi ID (License, Skill) ada di sheet MASTER."]);
    notesSheet.getColumn(1).width = 60;

    // Sheet 3: MASTER
    const masterSheet = workbook.addWorksheet("MASTER");
    
    // Fetch all licenses and skills
    const licenses = await this.licenseRepository.find({
      where: { deleted_at: IsNull() },
      order: { license_name: "ASC" },
    });

    const skills = await this.skillRepository.find({
      where: { deleted_at: IsNull() },
      order: { name: "ASC" },
    });

    // Licenses section
    masterSheet.addRow(["LICENSES"]);
    masterSheet.addRow(["License ID", "License Code", "License Name"]);
    
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
      ]);
    }

    // Add spacing
    masterSheet.addRow([]);
    masterSheet.addRow([]);

    // Skills section
    masterSheet.addRow(["SKILLS"]);
    masterSheet.addRow(["Skill ID", "Skill Name"]);
    
    const skillHeaderRow = masterSheet.getRow(masterSheet.rowCount);
    skillHeaderRow.font = { bold: true };
    skillHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    for (const skill of skills) {
      masterSheet.addRow([
        skill.id,
        skill.name,
      ]);
    }

    // Set column widths for MASTER sheet
    masterSheet.getColumn(1).width = 40; // ID columns
    masterSheet.getColumn(2).width = 30; // Name/Number columns
    masterSheet.getColumn(3).width = 40; // License Name

    // Freeze header rows (first section header + column headers)
    masterSheet.views = [{ state: "frozen", ySplit: 2 }];

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=license_skill_mapping_template.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Process a single row from Excel upload (column 1 = ID; if present and found → update, else → insert)
   */
  private async processMappingRow(
    rowData: any[],
    rowNumber: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Column order: ID, License ID, Skill ID (1-based)
      const idRaw = rowData[1]?.toString()?.trim();
      const licenseId = rowData[2]?.toString()?.trim();
      const skillId = rowData[3]?.toString()?.trim();

      if (!licenseId || !skillId) {
        throw new Error("Missing required fields");
      }

      const dto: CreateLicenseSkillMappingDto = {
        license_id: licenseId,
        skill_id: skillId,
      };

      await this.validateForeignKeys(dto);

      const existing = idRaw ? await this.dao.findById(idRaw) : null;
      if (existing) {
        await this.dao.update(existing.id, dto);
      } else {
        const duplicate = await this.dao.findDuplicate(dto);
        if (duplicate) {
          throw new Error("Mapping with this license and skill combination already exists");
        }
        await this.dao.create(dto);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: `Row ${rowNumber}: ${errorMessage}` };
    }
  }

  /**
   * Upload and process Excel file with mappings
   */
  async uploadMappings(
    file: Express.Multer.File
  ): Promise<UploadLicenseSkillMappingResponseDto> {
    const result: UploadLicenseSkillMappingResponseDto = {
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
          const rowResult = await this.processMappingRow(row.values as any[], rowNumber);
          
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

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new HttpException(
        `Error processing file: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get grouped license skill mappings with pagination
   * Groups mappings by license_id (DB-level grouping)
   * Returns license groups with their associated skills
   */
  async getGroupedMappings(
    filters?: { license_name?: string; skill_name?: string; page?: number; limit?: number }
  ): Promise<BasePagination<GroupedLicenseSkillResponseDto>> {
    // Get paginated grouped mappings (grouping done at DB level)
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    
    const { items, total } = await this.dao.findAllGroupedWithPagination(
      filters?.license_name,
      filters?.skill_name,
      page,
      limit
    );

    // Map DB results to DTO format
    const mappedItems: GroupedLicenseSkillResponseDto[] = items.map((item: any) => ({
      license: item.license,
      skills: item.skills || [],
    }));

    // Build pagination response
    const paginationResult = new BasePagination<GroupedLicenseSkillResponseDto>();
    paginationResult.items = mappedItems;
    paginationResult.meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return paginationResult;
  }

  /**
   * Find skills by multiple license IDs in one query
   * Returns map of license_id -> skill names[] for efficient lookup
   * @param licenseIds Array of license IDs
   * @returns Map of license_id -> skill names (string[])
   */
  async findSkillsByLicenseIds(licenseIds: string[]): Promise<Map<string, string[]>> {
    if (licenseIds.length === 0) {
      return new Map();
    }

    const mappings = await this.dao.findByLicenseIds(licenseIds);
    
    // Build map: license_id -> skill names[]
    const skillsMap = new Map<string, string[]>();
    for (const mapping of mappings) {
      if (mapping.skill) {
        const existing = skillsMap.get(mapping.license_id) || [];
        existing.push(mapping.skill.name);
        skillsMap.set(mapping.license_id, existing);
      }
    }

    return skillsMap;
  }
}

