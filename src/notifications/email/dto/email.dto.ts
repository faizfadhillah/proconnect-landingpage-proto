import { ApiProperty } from "@nestjs/swagger";

export class SendRegistrationEmailJobData {
  @ApiProperty({
    description: "The ID of the email log entry",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  emailLogId: string;

  @ApiProperty({
    description: "The ID of the user",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  userId: string;

  @ApiProperty({
    description: "The email address to send to",
    example: "user@example.com",
  })
  email: string;

  @ApiProperty({
    description: "The generated password for the user",
    example: "Abc123!@#",
  })
  password: string;
}