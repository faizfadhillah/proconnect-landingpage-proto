import { ApiProperty } from "@nestjs/swagger";
import { MstCompanyResponseDto } from "./mst-company-response.dto";
import { CompanyBranchResponseDto } from "./company-branch-response.dto";

export class PublicCompanyResponseDto extends MstCompanyResponseDto {
  @ApiProperty({
    description:
      "Branches for this company (HQ + branches resolved by company name). Empty for non-HQ companies.",
    type: [CompanyBranchResponseDto],
    required: true,
    example: [],
  })
  branches: CompanyBranchResponseDto[];
}

