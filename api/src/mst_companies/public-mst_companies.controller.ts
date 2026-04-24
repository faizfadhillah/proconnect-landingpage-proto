import { Controller, Get, Param } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "src/auth/public.decorator";
import { PublicCompanyResponseDto } from "./dto/public-company-response.dto";
import { MstCompaniesService } from "./service/mst_companies.service";
import { MstCompanyHqBranchRelationService } from "./service/company_hq_branch_relation.service";

@Controller("public/mst-companies")
@ApiTags("public-mst-companies")
export class PublicMstCompaniesController {
  constructor(
    private readonly mstCompaniesService: MstCompaniesService,
    private readonly companyHqBranchRelationService: MstCompanyHqBranchRelationService,
  ) {}

  @Get(":id")
  @Public()
  @ApiOperation({
    summary: "Get public company details by ID",
    operationId: "publicFindCompanyById",
  })
  @ApiResponse({
    status: 200,
    description:
      "Public company details including departments and, for HQ companies, branches.",
    type: PublicCompanyResponseDto,
  })
  @ApiResponse({ status: 404, description: "Company not found" })
  async findOnePublic(
    @Param("id") id: string,
  ): Promise<PublicCompanyResponseDto> {
    const baseCompany = await this.mstCompaniesService.findOne(id);

    let branches = [];
    if (baseCompany.isHqCompany()) {
      // Get only branches, skip the HQ itself
      const branchResult =
        await this.companyHqBranchRelationService.getAvailableBranches(id, undefined, undefined, undefined, true);
      branches = branchResult.items ?? [];
    }

    const response = new PublicCompanyResponseDto();
    Object.assign(response, baseCompany, { branches });
    return response;
  }
}

