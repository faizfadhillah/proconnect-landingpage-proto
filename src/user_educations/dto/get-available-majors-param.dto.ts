import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class GetAvailableMajorsParamDto {
  @ApiProperty({
    description: "School ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
    required: true,
  })
  @IsUUID("4", { message: "schoolId must be a valid UUID (v4)" })
  schoolId: string;
}
