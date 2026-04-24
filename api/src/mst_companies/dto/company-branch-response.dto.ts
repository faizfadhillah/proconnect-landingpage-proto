import { ApiProperty } from "@nestjs/swagger";

export class CompanyBranchResponseDto {
  @ApiProperty({
    description: "Company ID",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  id: string;

  @ApiProperty({
    description: "Company name",
    example: "PT Google Indonesia Teknologi",
  })
  company_name: string;

  @ApiProperty({
    description: "Branch name (null for headquarters)",
    example: "Jakarta Selatan",
    nullable: true,
  })
  branch: string | null;

  @ApiProperty({
    description: "Display name for dropdown",
    example: "Jakarta Selatan",
  })
  display_name: string;

  @ApiProperty({
    description: "Branch location / address",
    example: "Pacific Century Place, SCBD, Jakarta Selatan",
  })
  location: string;
}