import * as ExcelJS from "exceljs";
import * as csv from "csv-parser";
import { BadRequestException } from "@nestjs/common";
import * as fs from "fs";
import { UserGender } from "../../users/entities/user.entity";

export interface ParsedRow {
  email: string;
  name: string;
  phone: string;
  gender: string;
  rowNumber: number;
}

export class FileParserUtil {
  /**
   * Parse Excel or CSV file and return normalized data
   */
  public async parseFile(file: Express.Multer.File): Promise<ParsedRow[]> {
    if (file.mimetype.includes("spreadsheetml")) {
      return this.parseExcelFile(file);
    } else if (file.mimetype === "text/csv") {
      return this.parseCsvFile(file);
    } else {
      throw new BadRequestException("Unsupported file type");
    }
  }

  /**
   * Parse Excel file (.xlsx)
   */
  public async parseExcelFile(file: Express.Multer.File): Promise<ParsedRow[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(file.path);

    const worksheet = workbook.getWorksheet(1); // First sheet
    if (!worksheet) {
      throw new BadRequestException("Excel file must contain at least one worksheet");
    }

    const rows: ParsedRow[] = [];
    // rowNumber variable is unused here - removed

    // Get headers from first row
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values as any[];

    // Map header names to column indices
    const headerMap: { [key: string]: number } = {};
    headers.forEach((header, index) => {
      if (header && typeof header === 'string') {
        const normalizedHeader = this.normalizeHeader(header);
        headerMap[normalizedHeader] = index;
      }
    });

    worksheet.eachRow((row, rowIndex) => {
      // Skip header row
      if (rowIndex === 1) return;

      const cells = row.values as any[];

      // Use header mapping for flexible column order
      const email = cells[headerMap['email']]?.toString().trim() || "";
      const name = cells[headerMap['fullname']]?.toString().trim() || "";
      const phone = cells[headerMap['phone']]?.toString().trim() || "";
      const gender = cells[headerMap['gender']]?.toString().trim() || "";

      // Skip empty rows
      if (this.isEmptyParsedRow({ email, name, phone, gender, rowNumber: rowIndex })) {
        return;
      }

      rows.push({
        email,
        name,
        phone,
        gender,
        rowNumber: rowIndex,
      });
    });

    return rows;
  }

  /**
   * Parse CSV file
   */
  public async parseCsvFile(file: Express.Multer.File): Promise<ParsedRow[]> {
    return new Promise((resolve, reject) => {
      const rows: ParsedRow[] = [];
      let rowNumber = 1; // Start from 1 (header row)

      fs.createReadStream(file.path)
        .pipe(csv())
        .on("data", (data) => {
          rowNumber++;
          // CSV parser returns object with column headers as keys
          const email = data.email?.toString().trim() || "";
          const name = data.fullname?.toString().trim() || "";
          const phone = data.phone?.toString().trim() || "";
          const gender = data.gender?.toString().trim() || "";

          // Skip empty rows
          if (this.isEmptyParsedRow({ email, name, phone, gender, rowNumber })) {
            return;
          }

          rows.push({
            email,
            name,
            phone,
            gender,
            rowNumber,
          });
        })
        .on("end", () => {
          resolve(rows);
        })
        .on("error", (error) => {
          reject(new BadRequestException(`Error parsing CSV file: ${error.message}`));
        });
    });
  }

  /**
   * Validate and normalize parsed data
   */
  public validateAndNormalizeData(rows: ParsedRow[], existingEmails: Set<string>): {
    validRows: ParsedRow[];
    errors: { rowNumber: number; errors: string[]; data: Partial<ParsedRow> }[];
  } {
    const validRows: ParsedRow[] = [];
    const errors: { rowNumber: number; errors: string[]; data: Partial<ParsedRow> }[] = [];

    // maps for duplicate checking
    const emailMap = new Map<string, ParsedRow[]>();
    const phoneMap = new Map<string, ParsedRow[]>();

    for (const row of rows) {
      const rowErrors: string[] = [];
      const originalData = { ...row }; // Keep original data for error reporting

      // Validate email
      const emailErrors = this.validateEmail(row, emailMap, existingEmails);
      rowErrors.push(...emailErrors);

      // Validate name
      const nameErrors = this.validateName(row);
      rowErrors.push(...nameErrors);

      // Validate phone
      const phoneErrors = this.validatePhone(row, phoneMap);
      rowErrors.push(...phoneErrors);

      // Validate gender
      const genderErrors = this.validateGender(row);
      rowErrors.push(...genderErrors);

      if (rowErrors.length > 0) {
        errors.push({
          rowNumber: row.rowNumber,
          errors: rowErrors,
          data: {
            email: originalData.email,
            name: originalData.name,
            phone: originalData.phone,
            gender: originalData.gender
          }
        });
      } else {
        validRows.push(row);
      }
    }

    return { validRows, errors };
  }

  /**
   * Validate email field
   */
  private validateEmail(
    row: ParsedRow,
    emailMap: Map<string, ParsedRow[]>,
    existingEmails: Set<string>
  ): string[] {
    const errors: string[] = [];

    // Check for duplicates in current batch
    if (emailMap.has(row.email)) {
      errors.push(`Email "${row.email}" already exists in this batch`);
    }

    // Check if email exists in database
    if (existingEmails.has(row.email)) {
      errors.push(`Email "${row.email}" already exists in database`);
    }

    // Validate email format and required field
    if (!row.email) {
      errors.push("Email is required");
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(row.email)) {
        errors.push(`Invalid email format: "${row.email}"`);
      }
      // Normalize email to lowercase
      row.email = row.email.toLowerCase();
    }

    // Add to email map for duplicate checking
    if (row.email) {
      if (!emailMap.has(row.email)) {
        emailMap.set(row.email, []);
      }
      emailMap.get(row.email)!.push(row);
    }

    return errors;
  }

  /**
   * Validate name field
   */
  private validateName(row: ParsedRow): string[] {
    const errors: string[] = [];

    if (!row.name) {
      errors.push("Name is required");
      return errors;
    }

    // Trim whitespace
    row.name = row.name.trim();

    // Check minimum length
    if (row.name.length < 2) {
      errors.push(`Name must be at least 2 characters long: "${row.name}"`);
    }

    // Check maximum length
    if (row.name.length > 100) {
      errors.push(`Name must be at most 100 characters long: "${row.name}"`);
    }

    // Check for invalid characters (allow letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(row.name)) {
      errors.push(`Name contains invalid characters. Only letters, spaces, hyphens, and apostrophes are allowed: "${row.name}"`);
    }

    return errors;
  }

  /**
   * Validate phone field
   */
  private validatePhone(row: ParsedRow, phoneMap: Map<string, ParsedRow[]>): string[] {
    const errors: string[] = [];

    if (!row.phone) {
      errors.push("Phone number is required");
      return errors;
    }

    const originalPhone = row.phone;
    
    // Remove spaces, dashes, and other non-digit characters except + and space
    let normalizedPhone = row.phone.replace(/[^\d+ ]/g, "");

    // Normalize Indonesian phone numbers
    normalizedPhone = this.normalizeIndonesianPhone(normalizedPhone);

    // Update the row with normalized phone
    row.phone = normalizedPhone;

    // Check for duplicates in current batch
    if (phoneMap.has(row.phone)) {
      errors.push(`Phone number "${originalPhone}" already exists in this batch`);
    }

    // Validate phone length
    if (row.phone.length < 11 ) {
      errors.push(`Phone number must be at least 10 digits: "${originalPhone}"`);
    }

    // Validate phone format (must start with +62 followed by space and digits)
    const phoneRegex = /^\+\d{2} \d+$/;
    if (!phoneRegex.test(row.phone)) {
      errors.push(`Invalid phone number format: "${originalPhone}"`);
    }

    // Add to phone map for duplicate checking
    if (row.phone) {
      if (!phoneMap.has(row.phone)) {
        phoneMap.set(row.phone, []);
      }
      phoneMap.get(row.phone)!.push(row);
    }

    return errors;
  }

  /**
   * Normalize Indonesian phone numbers to standard format: +62 [digits]
   */
  private normalizeIndonesianPhone(phone: string): string {
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, "");

    // Handle various Indonesian phone number formats
    if (normalized.startsWith('0')) {
      // Convert 08... to +62 8...
      normalized = '+62 ' + normalized.substring(1);
    } else if (normalized.startsWith('8') && !normalized.startsWith('+')) {
      // Convert 8... to +62 8...
      normalized = '+62 ' + normalized;
    } else if (normalized.startsWith('62') && !normalized.startsWith('+')) {
      // Convert 62... to +62 [rest]
      normalized = '+62 ' + normalized.substring(2);
    } else if (normalized.startsWith('+62') && normalized.length > 3) {
      // Convert +628... to +62 8...
      normalized = '+62 ' + normalized.substring(3);
    } else if (!normalized.startsWith('+62') && normalized.startsWith('+')) {
      // Ensure it starts with +62 for Indonesian numbers
      // If it starts with + but not +62, convert to +62 format
      if (normalized.length > 3) {
        normalized = '+62 ' + normalized.substring(1);
      }
    }

    return normalized;
  }

  /**
   * Validate gender field
   */
  private validateGender(row: ParsedRow): string[] {
    const errors: string[] = [];

    if (!row.gender) {
      errors.push("Gender is required");
      return errors;
    }

    const originalGender = row.gender;
    row.gender = row.gender.toLowerCase();

    const validGenders: string[] = [
      UserGender.MALE,
      UserGender.FEMALE,
      UserGender.NON_BINARY,
    ];

    if (!validGenders.includes(row.gender)) {
      errors.push(`Gender must be one of: male, female, non-binary. Received: "${originalGender}"`);
    }

    return errors;
  }

  /**
   * Normalize header names for flexible column mapping
   */
  private normalizeHeader(header: string): string {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .trim();
  }

  /**
   * Validate that required columns exist in the file
   */
  public async validateRequiredColumns(file: Express.Multer.File): Promise<void> {
    const requiredColumns = ['fullname', 'email', 'phone', 'gender'];

    if (file.mimetype.includes("spreadsheetml")) {
      // Excel validation
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(file.path);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new BadRequestException("Excel file must contain at least one worksheet");
      }

      const headerRow = worksheet.getRow(1);
      const headers = headerRow.values as any[];

      const normalizedHeaders = headers
        .filter(h => h && typeof h === 'string')
        .map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '').trim());

      const missingColumns = requiredColumns.filter(col =>
        !normalizedHeaders.includes(col.toLowerCase().replace(/[^a-z0-9]/g, '').trim())
      );

      if (missingColumns.length > 0) {
        throw new BadRequestException(`Missing required columns: ${missingColumns.join(", ")}`);
      }
    } else if (file.mimetype === "text/csv") {
      // CSV validation - check first line for headers
      const fs = await import("fs");
      const csvParser = await import("csv-parser");

      const headers: string[] = [];
      let hasHeaders = false;

      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(file.path)
          .pipe(csvParser.default())
          .on("headers", (headerList: string[]) => {
            headers.push(...headerList);
            hasHeaders = true;
          })
          .on("data", () => {
            // Stop after getting headers
            resolve();
          })
          .on("end", () => {
            if (!hasHeaders) {
              reject(new BadRequestException("CSV file must contain headers"));
            }
            resolve();
          })
          .on("error", reject);
      });

      const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '').trim());

      const missingColumns = requiredColumns.filter(col =>
        !normalizedHeaders.includes(col.toLowerCase().replace(/[^a-z0-9]/g, '').trim())
      );

      if (missingColumns.length > 0) {
        throw new BadRequestException(`Missing required columns: ${missingColumns.join(", ")}`);
      }
    
    }
  }

  /**
   * Check if parsed row is empty (all fields are empty or whitespace only)
   */
  private isEmptyParsedRow(row: ParsedRow): boolean {
    return (
      (!row.email || row.email.trim() === '') &&
      (!row.name || row.name.trim() === '') &&
      (!row.phone || row.phone.trim() === '') &&
      (!row.gender || row.gender.trim() === '')
    );
  }
}