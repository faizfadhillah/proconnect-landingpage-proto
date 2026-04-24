// src\user_educations\dto\approve-user_education.dto.ts
import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ApprovalState } from "src/common/enums/approval-state.enum";

export class ApproveUserEducationDto {
  @ApiProperty({
    description: "Approval state",
    example: ApprovalState.APPROVED,
    enum: ApprovalState,
  })
  @IsEnum(ApprovalState)
  approval_state: ApprovalState;
}

