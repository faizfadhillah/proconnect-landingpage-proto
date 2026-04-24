import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsArray, IsUUID } from "class-validator";

export class UpsertDepartmentMappingsDto {
  @ApiProperty({
    description: "Company ID to upsert mappings for. Can be branch or HQ - system auto-determines HQ.",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  @IsString()
  company_id: string;

  @ApiProperty({
    description: "Array of department IDs to map to the company. Must be GLOBAL or mapped to company HQ.",
    example: ["12345678-1234-1234-1234-1234567890ab", "87654321-4321-4321-4321-1234567890ab"],
    type: [String],
  })
  @IsArray()
  @IsUUID("all", { each: true })
  dept_ids: string[];
}