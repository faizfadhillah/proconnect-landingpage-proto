import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { EMAIL_TYPES } from "../../notifications/email/constants/constants";

export class RetryEmailDto {
  @ApiProperty({
    description: "The type of email to retry",
    example: EMAIL_TYPES.USER_CANDIDATE_BULK_DIRECT_REGISTRATION,
    enum: EMAIL_TYPES,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  type: string;
}