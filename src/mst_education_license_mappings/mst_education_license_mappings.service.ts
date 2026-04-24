import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { MstEducationLicenseMapping } from "./entities/mst_education_license_mapping.entity";
import { CreateEducationLicenseMappingDto } from "./dto/create-education-license-mapping.dto";
import { UpdateEducationLicenseMappingDto } from "./dto/update-education-license-mapping.dto";
import { UploadMappingResponseDto } from "./dto/upload-mapping.dto";
import { MstSchool } from "../mst_schools/entities/mst_school.entity";
import { MstMajor } from "../mst_majors/entities/mst_major.entity";
import { UserEducation } from "../user_educations/entities/user_education.entity";
import { MstLicense } from "../mst_licenses/entities/mst_license.entity";
import { MstMajorsService } from "../mst_majors/mst_majors.service";
import { MstLicensesService } from "../mst_licenses/mst_licenses.service";
import { UserRoleAssignmentService } from "../user_role_assignments/services/user_role_assignments.service";
import { ConfigsService } from "../config/config.service";
import { FieldsService } from "../zfields/fields.service";
import { BasePagination } from "../base.pagination";
import { UserWithRoles } from "../users/interfaces/user-with-roles.interface";
import { LoggingService } from "../logs/logs.service";
import { UserCertificatesService } from "../user_certificates/user_certificates.service";
import { MstEducationLicenseMappingDao } from "./dao/mst_education_license_mapping.dao";
import { RetroactiveEducationLicenseQueuePublisher } from "../queues/publishers/retroactive-education-license-queue.publisher";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import { Response } from "express";
import { ApprovalState } from "../common/enums/approval-state.enum";
import { GroupedEducationLicenseResponseDto } from "./dto/grouped-education-license-response.dto";

@Injectable()
export class MstEducationLicenseMappingsService {
  constructor(
    private readonly dao: MstEducationLicenseMappingDao,
    @InjectRepository(MstSchool)
    private schoolRepository: Repository<MstSchool>,
    @InjectRepository(MstMajor)
    private majorRepository: Repository<MstMajor>,
    @InjectRepository(MstLicense)
    private licenseRepository: Repository<MstLicense>,
    @InjectRepository(UserEducation)
    private userEducationRepository: Repository<UserEducation>,
    private readonly majorsService: MstMajorsService,
    private readonly licensesService: MstLicensesService,
    @Inject(forwardRef(() => UserRoleAssignmentService))
    private readonly userRoleAssignmentService: UserRoleAssignmentService,
    private readonly configService: ConfigsService,
    private readonly fieldsService: FieldsService,
    private readonly logger: LoggingService,
    private readonly userCertificatesService: UserCertificatesService,
    private readonly retroactiveEducationLicenseQueuePublisher: RetroactiveEducationLicenseQueuePublisher,
  ) {}

  /**
   * Create education license mapping
   */
  async create(
    dto: CreateEducationLicenseMappingDto,
    userId: string
  ): Promise<MstEducationLicenseMapping> {
    // 1. Check permission (Admin or PIC_SCHOOL)
    await this.checkPermission(userId, dto.school_id);

    // 2. Validate FKs exist
    await this.validateForeignKeys(dto);

    // 3. Check duplicate
    const duplicate = await this.dao.findDuplicate(dto);
    if (duplicate) {
      throw new BadRequestException("Mapping already exists");
    }

    // 4. Create
    const saved = await this.dao.create(dto);

    // 5. Trigger retroactive processing via queue
    await this.retroactiveEducationLicenseQueuePublisher.publishMappingJob(saved.id);

    return saved;
  }

  /**
   * Check if user has permission to create mapping for a school
   */
  private async checkPermission(
    userId: string,
    schoolId: string
  ): Promise<void> {
    // Check if SYS_ADMIN
    const isSysAdmin = await this.userRoleAssignmentService.isUserSysAdmin(userId);
    
    if (isSysAdmin) {
      return; // Full access
    }
    
    // Check if PIC_SCHOOL for this specific school
    const isPicSchoolForSchool = await this.userRoleAssignmentService.isUserPicSchoolForSchool(
      userId,
      schoolId
    );
    
    if (isPicSchoolForSchool) {
      return; // Access granted for this school
    }
    
    // No permission
    throw new ForbiddenException(
      "You do not have permission to create mapping for this school"
    );
  }

  /**
   * Validate all foreign keys exist
   */
  private async validateForeignKeys(
    dto: CreateEducationLicenseMappingDto
  ): Promise<void> {
    // Check school exists
    const school = await this.schoolRepository.findOne({
      where: { id: dto.school_id, deleted_at: IsNull() },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${dto.school_id} not found`);
    }

    // Check major exists
    try {
      await this.majorsService.findOne(dto.major_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Major with ID ${dto.major_id} not found`);
      }
      throw error;
    }

    // Check license exists
    try {
      await this.licensesService.findOne(dto.license_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`License with ID ${dto.license_id} not found`);
      }
      throw error;
    }

    // Validate diploma_level against config only when provided (null = wildcard, skip validation)
    if (dto.diploma_level != null && dto.diploma_level !== "") {
      try {
        const educationLevelConfig = await this.configService.findByKey("education_level");
        const validLevels = educationLevelConfig.value.map((l: any) => l.code);
        if (!validLevels.includes(dto.diploma_level)) {
          throw new BadRequestException(
            `Invalid diploma level: ${dto.diploma_level}. Valid levels: ${validLevels.join(", ")}`
          );
        }
      } catch (error) {
        if (error instanceof NotFoundException) {
          this.logger.warn("Education level config not found, skipping diploma_level validation");
        } else {
          throw error;
        }
      }
    }
  }


  /**
   * Update education license mapping
   */
  async update(
    id: string,
    dto: UpdateEducationLicenseMappingDto,
    userId: string
  ): Promise<MstEducationLicenseMapping> {
    const existing = await this.findOne(id);
    
    // Check permission for the school (use existing school_id if not changed)
    const schoolId = dto.school_id || existing.school_id;
    await this.checkPermission(userId, schoolId);
    
    // Validate FKs if changed
    if (dto.school_id || dto.major_id || dto.license_id) {
      const validationDto: CreateEducationLicenseMappingDto = {
        school_id: dto.school_id || existing.school_id,
        major_id: dto.major_id || existing.major_id,
        degree: dto.degree || existing.degree,
        diploma_level: dto.diploma_level !== undefined ? (dto.diploma_level ?? null) : existing.diploma_level,
        license_id: dto.license_id || existing.license_id,
      };
      await this.validateForeignKeys(validationDto);
    }
    
    // Update using DAO
    const updated = await this.dao.update(id, dto);

    // If any mapping criteria changed, trigger retroactive processing
    if (
      dto.school_id !== undefined || dto.major_id !== undefined || dto.degree !== undefined ||
      dto.diploma_level !== undefined || dto.license_id !== undefined
    ) {
      await this.retroactiveEducationLicenseQueuePublisher.publishMappingJob(updated.id);
    }

    return updated;
  }

  /**
   * Delete education license mapping (soft delete)
   */
  async remove(id: string, userId: string): Promise<void> {
    const mapping = await this.findOne(id);
    
    // Check permission
    await this.checkPermission(userId, mapping.school_id);
    
    // Soft delete using DAO
    await this.dao.softDelete(id);
  }

  /**
   * Find one mapping by ID
   */
  async findOne(id: string): Promise<MstEducationLicenseMapping> {
    const mapping = await this.dao.findById(id);
    
    if (!mapping) {
      throw new NotFoundException(`Mapping with ID ${id} not found`);
    }
    
    return mapping;
  }

  /**
   * Search education license mappings with scope filtering
   */
  async search(
    params: {
      id?: string;
      filters: Record<string, any>;
      page?: number;
      limit?: number;
      sortBy?: any;
      expands?: string;
      isExcel?: string;
      res?: Response;
      user?: UserWithRoles;
    }
  ): Promise<BasePagination<MstEducationLicenseMapping>> {
    const { user, isExcel, res, ...searchParams } = params;
    
    // Apply school scope for PIC_SCHOOL users
    if (user && !user.isSysAdmin) {
      const isPicSchool = await this.userRoleAssignmentService.isUserPicSchool(user.id);
      
      if (isPicSchool) {
        // Get user's assigned school_ids
        const assignedSchools = await this.userRoleAssignmentService.getUserAssignedSchools(user.id);
        
        // Add school filter (use property name: school_id)
        if (assignedSchools.length > 0) {
          // If filters already have school_id, merge with assigned schools
          if (searchParams.filters.school_id) {
            const existingSchoolIds = Array.isArray(searchParams.filters.school_id)
              ? searchParams.filters.school_id
              : [searchParams.filters.school_id];
            
            // Intersection: only schools that are both in filter and assigned to user
            searchParams.filters.school_id = existingSchoolIds.filter((id: string) =>
              assignedSchools.includes(id)
            );
          } else {
            // No existing filter, use assigned schools
            searchParams.filters.school_id = assignedSchools;
          }
          
          // If after filtering there are no schools, return empty result
          if (
            !searchParams.filters.school_id ||
            (Array.isArray(searchParams.filters.school_id) && searchParams.filters.school_id.length === 0)
          ) {
            return {
              items: [],
              meta: {
                total: 0,
                page: searchParams.page || 1,
                limit: searchParams.limit || 10,
                totalPages: 0,
              },
            };
          }
        } else {
          // No schools assigned, return empty result
          return {
            items: [],
            meta: {
              total: 0,
              page: searchParams.page || 1,
              limit: searchParams.limit || 10,
              totalPages: 0,
            },
          };
        }
      }
    }
    
    // Use FieldsService for search
    return await this.fieldsService.search(MstEducationLicenseMapping, {
      ...searchParams,
      expands: searchParams.expands || '',
      isExcel,
      res,
      options: {},
    });
  }

  /**
   * Download Excel template for bulk upload (prepopulated with current data + ID column)
   */
  async downloadTemplate(res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Data (ID + mapping columns, prepopulated)
    const worksheet = workbook.addWorksheet('Education License Mapping');
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 40 },
      { header: 'School ID', key: 'school_id', width: 40 },
      { header: 'Major ID', key: 'major_id', width: 40 },
      { header: 'Degree', key: 'degree', width: 15 },
      { header: 'Diploma Level', key: 'diploma_level', width: 15 },
      { header: 'License ID', key: 'license_id', width: 40 },
    ];
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };
    const mappings = await this.dao.findAllActive();
    for (const m of mappings) {
      worksheet.addRow({
        id: m.id,
        school_id: m.school_id,
        major_id: m.major_id,
        degree: m.degree,
        diploma_level: m.diploma_level ?? '',
        license_id: m.license_id,
      });
    }

    // Sheet 2: NOTES for end user
    const notesSheet = workbook.addWorksheet('NOTES');
    notesSheet.addRow(['Panduan upload:']);
    notesSheet.addRow(['- Kolom ID: Jika kosong = insert baru. Jika terisi = update data yang ada.']);
    notesSheet.addRow(['- Referensi ID (School, Major, License, dll) ada di sheet MASTER.']);
    notesSheet.getColumn(1).width = 60;

    // Sheet 3: MASTER
    const masterSheet = workbook.addWorksheet("MASTER");
    
    // Fetch all master data
    const schools = await this.schoolRepository.find({
      where: { deleted_at: IsNull() },
      order: { name: "ASC" },
    });

    const majors = await this.majorRepository.find({
      where: { deleted_at: IsNull() },
      order: { major_name: "ASC" },
    });

    const licenses = await this.licenseRepository.find({
      where: { deleted_at: IsNull() },
      order: { license_name: "ASC" },
    });

    // Get diploma levels from config
    let diplomaLevels: Array<{ code: string; description?: string }> = [];
    try {
      const educationLevelConfig = await this.configService.findByKey("education_level");
      diplomaLevels = educationLevelConfig.value || [];
    } catch (error) {
      // If config not found, use common values
      diplomaLevels = [
        { code: "L1", description: "Level 1" },
        { code: "L2", description: "Level 2" },
        { code: "L3", description: "Level 3" },
        { code: "DIPLOMA", description: "Diploma" },
        { code: "ADV_DIPLOMA", description: "Advanced Diploma" },
        { code: "CERT_III", description: "Certificate III" },
      ];
    }

    // Schools section
    masterSheet.addRow(["SCHOOLS"]);
    masterSheet.addRow(["School ID", "School Name", "Region ID", "Address"]);
    
    const schoolHeaderRow = masterSheet.getRow(masterSheet.rowCount);
    schoolHeaderRow.font = { bold: true };
    schoolHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    for (const school of schools) {
      masterSheet.addRow([
        school.id,
        school.name || "",
        school.region_id || "",
        school.address || "",
      ]);
    }

    // Add spacing
    masterSheet.addRow([]);
    masterSheet.addRow([]);

    // Majors section
    masterSheet.addRow(["MAJORS"]);
    masterSheet.addRow(["Major ID", "Major Name"]);
    
    const majorHeaderRow = masterSheet.getRow(masterSheet.rowCount);
    majorHeaderRow.font = { bold: true };
    majorHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    for (const major of majors) {
      masterSheet.addRow([
        major.id,
        major.major_name,
      ]);
    }

    // Add spacing
    masterSheet.addRow([]);
    masterSheet.addRow([]);

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

    // Education Degrees section
    masterSheet.addRow(["EDUCATION DEGREES"]);
    masterSheet.addRow(["Degree Code", "Description"]);
    
    const degreeHeaderRow = masterSheet.getRow(masterSheet.rowCount);
    degreeHeaderRow.font = { bold: true };
    degreeHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    const degreeDescriptions: Record<string, string> = {
      S1: "Sarjana (Bachelor)",
      S2: "Magister (Master)",
      S3: "Doktor (Doctorate)",
      D3: "Diploma 3",
      D4: "Diploma 4",
      SMK: "Sekolah Menengah Kejuruan",
      SMA: "Sekolah Menengah Atas",
    };

    for (const [degree, description] of Object.entries(degreeDescriptions)) {
      masterSheet.addRow([
        degree,
        description || degree,
      ]);
    }

    // Add spacing
    masterSheet.addRow([]);
    masterSheet.addRow([]);

    // Diploma Levels section
    masterSheet.addRow(["DIPLOMA LEVELS"]);
    masterSheet.addRow(["Level Code", "Description"]);
    
    const levelHeaderRow = masterSheet.getRow(masterSheet.rowCount);
    levelHeaderRow.font = { bold: true };
    levelHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    for (const level of diplomaLevels) {
      masterSheet.addRow([
        level.code,
        level.description || level.code,
      ]);
    }

    // Set column widths for MASTER sheet
    masterSheet.getColumn(1).width = 40; // ID columns
    masterSheet.getColumn(2).width = 40; // Name columns
    masterSheet.getColumn(3).width = 20; // Region ID / License Number
    masterSheet.getColumn(4).width = 50; // Address

    // Freeze header rows
    masterSheet.views = [{ state: "frozen", ySplit: 2 }];

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=education_license_mapping_template.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Process a single row from Excel upload (column 1 = ID; if present and found → update, else → insert)
   */
  private async processMappingRow(
    rowData: any[],
    rowNumber: number,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Column order: ID, School ID, Major ID, Degree, Diploma Level, License ID (1-based)
      const idRaw = rowData[1]?.toString()?.trim();
      const schoolId = rowData[2]?.toString()?.trim();
      const majorId = rowData[3]?.toString()?.trim();
      const degree = rowData[4]?.toString()?.trim();
      const diplomaLevelRaw = rowData[5]?.toString()?.trim();
      const licenseId = rowData[6]?.toString()?.trim();

      if (!schoolId || !majorId || !degree || !licenseId) {
        throw new Error('Missing required fields');
      }
      const diplomaLevel = diplomaLevelRaw && diplomaLevelRaw.length > 0 ? diplomaLevelRaw : null;

      const dto: CreateEducationLicenseMappingDto = {
        school_id: schoolId,
        major_id: majorId,
        degree: degree,
        diploma_level: diplomaLevel ?? null,
        license_id: licenseId,
      };

      await this.checkPermission(userId, dto.school_id);
      await this.validateForeignKeys(dto);

      const existing = idRaw ? await this.dao.findById(idRaw) : null;
      if (existing) {
        await this.dao.update(existing.id, dto);
      } else {
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
    file: Express.Multer.File,
    userId: string
  ): Promise<UploadMappingResponseDto> {
    const result: UploadMappingResponseDto = {
      success_count: 0,
      error_count: 0,
      errors: [],
      message: '',
    };

    if (!file) {
      throw new BadRequestException('File not found');
    }

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(file.path);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException('Worksheet not found in Excel file');
      }

      const rowPromises: Promise<void>[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const processRow = async () => {
          const rowResult = await this.processMappingRow(row.values as any[], rowNumber, userId);
          
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
   * Find education-license mappings by education data
   * Used by: Education Verification Flow
   */
  async findByEducation(education: UserEducation): Promise<MstEducationLicenseMapping[]> {
    return await this.dao.findByEducation(education);
  }

  /**
   * Process retroactive mappings - find all verified educations matching this mapping and grant licenses
   */
  async processRetroactiveMappings(mappingId: string): Promise<{
    processed_count: number;
    errors: string[];
  }> {
    const mapping = await this.findOne(mappingId);
    
    // Ensure license is loaded (findOne already loads it, but double-check)
    if (!mapping.license) {
      const license = await this.licensesService.findOne(mapping.license_id);
      mapping.license = license;
    }
    
    const result = {
      processed_count: 0,
      errors: [],
    };

    // Find all verified educations that match this mapping
    const matchingEducations = await this.findMatchingVerifiedEducations(mapping);

    this.logger.log(
      `Found ${matchingEducations.length} matching verified educations for retroactive processing`,
      'retroactive_processing',
      { mappingId: mapping.id, licenseId: mapping.license_id, count: matchingEducations.length }
    );

    for (const education of matchingEducations) {
      try {
        await this.userCertificatesService.grantVerifiedLicense(
          education.user_id,
          mapping.license_id,
          mapping.license,
          'Granted retroactively via education-license mapping'
        );
        result.processed_count++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(
          `User ${education.user_id}: ${errorMessage}`
        );
        this.logger.error(
          `Error granting license retroactively to user ${education.user_id}`,
          'retroactive_processing',
          error?.stack || error?.message || String(error),
          {
            error: errorMessage,
            userId: education.user_id,
            educationId: education.id,
            mappingId: mapping.id,
            licenseId: mapping.license_id,
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
   * Find all verified educations that match this mapping criteria
   */
  private async findMatchingVerifiedEducations(
    mapping: MstEducationLicenseMapping
  ): Promise<UserEducation[]> {
    const where: Record<string, unknown> = {
      school_id: mapping.school_id,
      major_id: mapping.major_id,
      education_degree: mapping.degree,
      approval_state: ApprovalState.APPROVED,
      deleted_at: IsNull(),
    };
    if (mapping.diploma_level != null) {
      where.diploma_level = mapping.diploma_level;
    }
    return await this.userEducationRepository.find({ where: where as any });
  }

  /**
   * Get grouped education license mappings with pagination
   * Groups mappings by school_id, major_id, degree, and diploma_level (DB-level grouping)
   * Returns education groups with their associated licenses
   */
  async getGroupedMappings(
    user?: UserWithRoles,
    filters?: { 
      school_name?: string; 
      major_name?: string; 
      school_id?: string;
      major_id?: string;
      degree?: string;
      diploma_level?: string;
      page?: number; 
      limit?: number;
    }
  ): Promise<BasePagination<GroupedEducationLicenseResponseDto>> {
    // Determine school scope for permission
    let schoolIds: string[] | undefined;

    if (user && !user.isSysAdmin) {
      const isPicSchool = await this.userRoleAssignmentService.isUserPicSchool(user.id);
      
      if (isPicSchool) {
        // Get user's assigned school_ids
        const assignedSchools = await this.userRoleAssignmentService.getUserAssignedSchools(user.id);
        
        if (assignedSchools.length > 0) {
          // PIC_SCHOOL can only see their assigned schools
          schoolIds = assignedSchools;
        } else {
          // No schools assigned, return empty pagination
          const paginationResult = new BasePagination<GroupedEducationLicenseResponseDto>();
          paginationResult.items = [];
          paginationResult.meta = {
            total: 0,
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            totalPages: 0,
          };
          return paginationResult;
        }
      }
    }

    // If school_id filter is provided, combine with permission-based schoolIds
    if (filters?.school_id) {
      if (schoolIds && schoolIds.length > 0) {
        // If user has restricted access, ensure the filtered school_id is in their allowed list
        if (!schoolIds.includes(filters.school_id)) {
          // User doesn't have access to this school, return empty
          const paginationResult = new BasePagination<GroupedEducationLicenseResponseDto>();
          paginationResult.items = [];
          paginationResult.meta = {
            total: 0,
            page: filters?.page || 1,
            limit: filters?.limit || 10,
            totalPages: 0,
          };
          return paginationResult;
        }
        // Use the filtered school_id only
        schoolIds = [filters.school_id];
      } else {
        // No permission restriction, use the filtered school_id
        schoolIds = [filters.school_id];
      }
    }

    // Get paginated grouped mappings (grouping done at DB level)
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    
    const { items, total } = await this.dao.findAllGroupedWithPagination(
      schoolIds,
      filters?.school_name,
      filters?.major_name,
      filters?.major_id,
      filters?.degree,
      filters?.diploma_level,
      page,
      limit
    );

    // Map DB results to DTO format
    const mappedItems: GroupedEducationLicenseResponseDto[] = items.map((item: any) => ({
      degree: item.degree,
      diploma_level: item.diploma_level,
      school: item.school,
      major: item.major,
      licenses: item.licenses || [],
    }));

    // Build pagination response
    const paginationResult = new BasePagination<GroupedEducationLicenseResponseDto>();
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
   * Process retroactive education-license mapping for specific license and user
   * Check if user has verified educations that should grant this specific license
   * Used when user creates a certificate - check if education should have already granted this license
   */
  async processRetroactiveEducationForLicense(
    userId: string,
    licenseId: string
  ): Promise<void> {
    // Get license entity
    const license = await this.licensesService.findOne(licenseId);
    if (!license) {
      this.logger.warn(
        `License not found for retroactive processing`,
        'retroactive_processing',
        { userId, licenseId }
      );
      return;
    }

    // Find all verified educations for user
    const verifiedEducations = await this.userEducationRepository.find({
      where: {
        user_id: userId,
        approval_state: ApprovalState.APPROVED,
        deleted_at: IsNull(),
      },
    });

    if (verifiedEducations.length === 0) {
      this.logger.log(
        `No verified educations found for user ${userId}`,
        'retroactive_processing',
        { userId, licenseId }
      );
      return;
    }

    // For each education, find matching mapping for this specific license
    for (const education of verifiedEducations) {
      try {
        // Validate required fields (diploma_level optional; DAO matches mapping with diploma_level NULL)
        if (!education.school_id || !education.major_id || !education.education_degree) {
          continue;
        }

        // Find education-license mapping for this education and specific license
        const matchingMapping = await this.dao.findByEducationAndLicenseId(education, licenseId);

        if (matchingMapping) {
          // Grant this specific license
          await this.userCertificatesService.grantVerifiedLicense(
            userId,
            licenseId,
            license,
            'Granted retroactively via education-license mapping',
          );
          
          this.logger.log(
            `Granted license ${licenseId} to user ${userId} retroactively from education ${education.id}`,
            'retroactive_processing',
            { userId, licenseId, educationId: education.id }
          );
          // Only need to grant once, break after first match
          break;
        }
      } catch (error) {
        this.logger.error(
          `Error processing retroactive education for license ${licenseId} and user ${userId}`,
          'retroactive_processing',
          error?.stack || error?.message || String(error),
          {
            error: error instanceof Error ? error.message : String(error),
            userId,
            licenseId,
            educationId: education.id,
          }
        );
        // Continue with other educations
      }
    }
  }
}

