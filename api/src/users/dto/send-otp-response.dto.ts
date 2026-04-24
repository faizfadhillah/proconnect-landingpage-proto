import { ApiProperty } from "@nestjs/swagger";

export class SendOtpResponseDto {
  @ApiProperty({
    example: "OTP sent successfully via SMS",
    description: "Human-readable status message for the OTP send request",
  })
  message: string;

  @ApiProperty({
    example: "2026-03-02T12:34:56.000Z",
    description: "UTC timestamp indicating when the OTP will expire",
  })
  validUntil: string;
}

