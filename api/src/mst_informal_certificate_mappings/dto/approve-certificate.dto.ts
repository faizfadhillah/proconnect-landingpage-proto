// src\mst_informal_certificate_mappings\dto\approve-certificate.dto.ts
import { IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ApprovalState } from "src/common/enums/approval-state.enum";

export class ApproveCertificateDto {
  @ApiProperty({
    description: "Approval state",
    example: ApprovalState.APPROVED,
    enum: ApprovalState,
  })
  @IsEnum(ApprovalState)
  approval_state: ApprovalState;
}
