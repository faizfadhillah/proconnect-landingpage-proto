import { IsUUID, IsString, IsEnum, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { FileType } from "../entities/company_file.entity";

export class CreateCompanyFileDto {
  @ApiProperty({
    type: String,
    description: "The id of the company",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  company_id: string;

  @ApiProperty({
    type: String,
    description: "The name of the file",
    example: "example.txt",
  })
  @IsString()
  @Length(3, 255)
  file_name: string;

  @ApiProperty({
    type: String,
    description:
      "The type of the file (pdf, doc, docx, xls, xlsx, jpg, png, other)",
    enum: FileType,
    example: FileType.PDF,
  })
  @IsEnum(FileType, {
    message: `file_type must be one of the following values.`,
  })
  file_type: FileType;

  @ApiProperty({
    type: String,
    description: "The URL of the file",
    example: "https://example.com/file.txt",
  })
  @IsString()
  @Length(3, 255)
  file_url: string;
}
