import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as ExcelJS from "exceljs";
import { UPLOAD_BATCH_ROW_TYPES, UploadBatchRowType } from "../constants/constants";

@Injectable()
export class TemplateService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Generate Excel template based on type
   */
  async generateTemplate(type: UploadBatchRowType): Promise<ExcelJS.Workbook> {
    switch (type) {
      case UPLOAD_BATCH_ROW_TYPES.CANDIDATE_REGISTRATION:
        return this.generateCandidateRegistrationTemplate();
      default:
        throw new BadRequestException(`Unsupported template type: ${type}`);
    }
  }

  /**
   * Generate candidate registration template
   */
  private generateCandidateRegistrationTemplate(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Template with headers
    const templateSheet = workbook.addWorksheet("Template");
    templateSheet.addRow(["full_name", "email", "phone", "gender"]);

    // Sheet 2: Guidelines
    const guidelineSheet = workbook.addWorksheet("Guidelines");

    // Add title
    guidelineSheet.addRow(["BULK CANDIDATE UPLOAD GUIDELINES"]);
    guidelineSheet.addRow([]);
    const maxRows = this.configService.get<number>("BULK_UPLOAD_MAX_FILE_ROWS", 5000);

    guidelineSheet.addRow(["IMPORTANT NOTES:"]);
    guidelineSheet.addRow([`• Maximum ${maxRows} rows per file`]);
    guidelineSheet.addRow(["• File must be Excel (.xlsx) or CSV format"]);
    guidelineSheet.addRow(["• All emails must be unique within the batch"]);
    guidelineSheet.addRow(["• Email format must be valid"]);
    guidelineSheet.addRow(["• Name is required and must be at least 2 characters"]);
    guidelineSheet.addRow(["• Phone number minimum 10 digits"]);
    guidelineSheet.addRow(["• Gender must be one of: male, female, non-binary (case insensitive)"]);
    guidelineSheet.addRow(["• Duplicate emails within the same batch are not allowed"]);
    guidelineSheet.addRow(["• Existing users in the system cannot be re-registered"]);
    guidelineSheet.addRow(["• Empty phone and gender fields are allowed and will be saved as null"]);
    guidelineSheet.addRow([]);

    guidelineSheet.addRow(["COLUMN DESCRIPTIONS:"]);
    guidelineSheet.addRow([]);
    guidelineSheet.addRow(["full_name:"]);
    guidelineSheet.addRow(["• Required field"]);
    guidelineSheet.addRow(["• Minimum 2 characters"]);
    guidelineSheet.addRow(["• Will be used as display name"]);
    guidelineSheet.addRow([]);

    guidelineSheet.addRow(["email:"]);
    guidelineSheet.addRow(["• Required field"]);
    guidelineSheet.addRow(["• Must be valid email format"]);
    guidelineSheet.addRow(["• Must be unique within batch"]);
    guidelineSheet.addRow(["• Cannot already exist in system"]);
    guidelineSheet.addRow([]);

    guidelineSheet.addRow(["phone:"]);
    guidelineSheet.addRow(["• Required field"]);
    guidelineSheet.addRow(["• Must be minimum 10 digits"]);
    guidelineSheet.addRow(["• Will be encrypted for security"]);
    guidelineSheet.addRow([]);

    guidelineSheet.addRow(["gender:"]);
    guidelineSheet.addRow(["• Required field"]);
    guidelineSheet.addRow(["• Accepted values: male, female, non-binary"]);
    guidelineSheet.addRow(["• Case insensitive"]);
    guidelineSheet.addRow([]);

    guidelineSheet.addRow(["SAMPLE DATA:"]);
    guidelineSheet.addRow([]);
    guidelineSheet.addRow(["full_name", "email", "phone", "gender"]);
    guidelineSheet.addRow(["John Doe", "john.doe@example.com", "+628123456789", "male"]);
    guidelineSheet.addRow(["Jane Smith", "jane.smith@example.com", "+628987654321", "female"]);
    guidelineSheet.addRow(["Alex Johnson", "alex.johnson@example.com", "+628123456789", "non-binary"]);
    
    // Set column widths for better readability
    templateSheet.getColumn(1).width = 15;
    templateSheet.getColumn(2).width = 25;
    templateSheet.getColumn(3).width = 15;
    templateSheet.getColumn(4).width = 12;

    guidelineSheet.getColumn(1).width = 50;

    return workbook;
  }
}