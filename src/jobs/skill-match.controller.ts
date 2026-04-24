import {
  Controller,
  Get,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from "@nestjs/swagger";
import { JobSkillMatchService } from "./services/job-skill-match.service";
import { SkillMatchDetailResponseDto } from "./dto/skill-match-detail-response.dto";
import { GetSkillMatchDetailDto } from "./dto/get-skill-match-detail.dto";

@Controller("skill-match")
@ApiTags("skill-match")
@ApiBearerAuth()
export class SkillMatchController {
  constructor(
    private readonly jobSkillMatchService: JobSkillMatchService,
  ) {}

  @Get("detail")
  @ApiOperation({
    summary: "Get detailed skill match information between job and applicant",
    operationId: "getSkillMatchDetail",
  })
  @ApiResponse({
    status: 200,
    description: "Returns detailed skill match information",
    type: SkillMatchDetailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - missing or invalid parameters",
  })
  @ApiResponse({
    status: 404,
    description: "Job or user not found",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized",
  })
  async getDetail(
    @Query() query: GetSkillMatchDetailDto,
  ): Promise<SkillMatchDetailResponseDto> {
    return await this.jobSkillMatchService.getSkillMatchDetail(
      query.job_id,
      query.applicant_user_id,
    );
  }
}
