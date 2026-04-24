import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull } from "typeorm";
import { MstEducationProfessionMapping } from "./entities/mst_education_profession_mapping.entity";
import { CreateEducationProfessionMappingDto } from "./dto/create-education-profession-mapping.dto";
import { UpdateEducationProfessionMappingDto } from "./dto/update-education-profession-mapping.dto";
import { UploadMappingResponseDto } from "./dto/upload-mapping.dto";
import { MstSchoolDao } from "../mst_schools/dao/mst_school.dao";
import { MstSchool } from "../mst_schools/entities/mst_school.entity";
import { MstMajor } from "../mst_majors/entities/mst_major.entity";
import { MstProfession } from "../mst_professions/entities/mst_profession.entity";
import { MstMajorsService } from "../mst_majors/mst_majors.service";
import { MstProfessionsService } from "../mst_professions/mst_professions.service";
import { ConfigsService } from "../config/config.service";
import { LoggingService } from "../logs/logs.service";
import { MstEducationProfessionMappingDao } from "./dao/mst_education_profession_mapping.dao";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import { Response } from "express";
import { BasePagination } from "../base.pagination";
import { GroupedEducationProfessionResponseDto } from "./dto/grouped-education-profession-response.dto";

@Injectable()
export class MstEducationProfessionMappingsService {
  constructor(
    private readonly dao: MstEducationProfessionMappingDao,
    private readonly schoolDao: MstSchoolDao,
    @InjectRepository(MstSchool)
    private schoolRepository: Repository<MstSchool>,
    @InjectRepository(MstMajor)
    private majorRepository: Repository<MstMajor>,
    @InjectRepository(MstProfession)
    private professionRepository: Repository<MstProfession>,
    private readonly majorsService: MstMajorsService,
    private readonly professionsService: MstProfessionsService,
    private readonly configService: ConfigsService,
    private readonly logger: LoggingService,
  ) {}

  /**
   * Create education profession mapping
   */
  async create(
    dto: CreateEducationProfessionMappingDto
  ): Promise<MstEducationProfessionMapping> {
    // 1. Validate FKs exist
    await this.validateForeignKeys(dto);

    // 2. Check duplicate
    const duplicate = await this.dao.findDuplicate(dto);
    if (duplicate) {
      throw new BadRequestException("Mapping already exists");
    }

    // 3. Create
    const saved = await this.dao.create(dto);

    return saved;
  }

  /**
   * Validate all foreign keys exist
   */
  private async validateForeignKeys(
    dto: CreateEducationProfessionMappingDto
  ): Promise<void> {
    // Check school exists
    const school = await this.schoolDao.findById(dto.school_id);
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

    // Check profession exists
    try {
      await this.professionsService.findOne(dto.profession_id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Profession with ID ${dto.profession_id} not found`);
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
   * Update education profession mapping
   */
  async update(
    id: string,
    dto: UpdateEducationProfessionMappingDto
  ): Promise<MstEducationProfessionMapping> {
    const existing = await this.findOne(id);
    
    // Validate FKs if changed
    if (dto.school_id || dto.major_id || dto.profession_id) {
      const validationDto: CreateEducationProfessionMappingDto = {
        school_id: dto.school_id || existing.school_id,
        major_id: dto.major_id || existing.major_id,
        degree: dto.degree || existing.degree,
        diploma_level: dto.diploma_level !== undefined ? (dto.diploma_level ?? null) : existing.diploma_level,
        profession_id: dto.profession_id || existing.profession_id,
      };
      await this.validateForeignKeys(validationDto);
    }
    
    // Update using DAO
    const updated = await this.dao.update(id, dto);

    return updated;
  }

  /**
   * Delete education profession mapping (soft delete)
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id);
    
    // Soft delete using DAO
    await this.dao.softDelete(id);
  }

  /**
   * Find one mapping by ID
   */
  async findOne(id: string): Promise<MstEducationProfessionMapping> {
    const mapping = await this.dao.findById(id);
    
    if (!mapping) {
      throw new NotFoundException(`Mapping with ID ${id} not found`);
    }
    
    return mapping;
  }

  /**
   * Download Excel template for bulk upload (prepopulated with current data + ID column)
   */
  async downloadTemplate(res: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Data (ID + mapping columns, prepopulated)
    const worksheet = workbook.addWorksheet('Education Profession Mapping');
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 40 },
      { header: 'School ID', key: 'school_id', width: 40 },
      { header: 'Major ID', key: 'major_id', width: 40 },
      { header: 'Degree', key: 'degree', width: 15 },
      { header: 'Diploma Level', key: 'diploma_level', width: 15 },
      { header: 'Profession ID', key: 'profession_id', width: 40 },
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
        profession_id: m.profession_id,
      });
    }

    // Sheet 2: NOTES for end user
    const notesSheet = workbook.addWorksheet('NOTES');
    notesSheet.addRow(['Panduan upload:']);
    notesSheet.addRow(['- Kolom ID: Jika kosong = insert baru. Jika terisi = update data yang ada.']);
    notesSheet.addRow(['- Referensi ID (School, Major, Profession, dll) ada di sheet MASTER.']);
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

    const professions = await this.professionRepository.find({
      where: { deleted_at: IsNull() },
      order: { name: "ASC" },
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

    // Professions section
    masterSheet.addRow(["PROFESSIONS"]);
    masterSheet.addRow(["Profession ID", "Profession Name"]);
    
    const professionHeaderRow = masterSheet.getRow(masterSheet.rowCount);
    professionHeaderRow.font = { bold: true };
    professionHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    for (const profession of professions) {
      masterSheet.addRow([
        profession.id,
        profession.name,
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
    masterSheet.getColumn(3).width = 20; // Region ID
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
      'attachment; filename=education_profession_mapping_template.xlsx'
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
      // Column order: ID, School ID, Major ID, Degree, Diploma Level, Profession ID (1-based)
      const idRaw = rowData[1]?.toString()?.trim();
      const schoolId = rowData[2]?.toString()?.trim();
      const majorId = rowData[3]?.toString()?.trim();
      const degree = rowData[4]?.toString()?.trim();
      const diplomaLevelRaw = rowData[5]?.toString()?.trim();
      const professionId = rowData[6]?.toString()?.trim();

      if (!schoolId || !majorId || !degree || !professionId) {
        throw new Error('Missing required fields');
      }
      const diplomaLevel = diplomaLevelRaw && diplomaLevelRaw.length > 0 ? diplomaLevelRaw : null;

      const dto: CreateEducationProfessionMappingDto = {
        school_id: schoolId,
        major_id: majorId,
        degree: degree,
        diploma_level: diplomaLevel ?? null,
        profession_id: professionId,
      };

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
    file: Express.Multer.File
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
   * Get grouped education profession mappings with pagination
   * Groups mappings by school_id, major_id, degree, and diploma_level (DB-level grouping)
   * Returns education groups with their associated professions
   */
  async getGroupedMappings(
    filters?: { school_name?: string; major_name?: string; page?: number; limit?: number }
  ): Promise<BasePagination<GroupedEducationProfessionResponseDto>> {
    // Get paginated grouped mappings (grouping done at DB level)
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    
    const { items, total } = await this.dao.findAllGroupedWithPagination(
      undefined, // schoolIds - not filtering by school IDs for now
      filters?.school_name,
      filters?.major_name,
      page,
      limit
    );

    // Map DB results to DTO format
    const mappedItems: GroupedEducationProfessionResponseDto[] = items.map((item: any) => ({
      degree: item.degree,
      diploma_level: item.diploma_level,
      school: item.school,
      major: item.major,
      professions: item.professions || [],
    }));

    // Build pagination response
    const paginationResult = new BasePagination<GroupedEducationProfessionResponseDto>();
    paginationResult.items = mappedItems;
    paginationResult.meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return paginationResult;
  }
}

