import { ApiProperty } from "@nestjs/swagger";

export class OtpEligibilityResponseDto {
  @ApiProperty({
    type: Boolean,
    description: "Whether the user is eligible to request OTP (no guard or guard expired)",
    example: true,
  })
  eligible: boolean;

  @ApiProperty({
    type: String,
    format: "date-time",
    nullable: true,
    description: "When the user becomes eligible again (ISO 8601). Null if already eligible.",
    example: "2025-03-07T12:00:00.000Z",
  })
  eligibleAt: string | null;
}
