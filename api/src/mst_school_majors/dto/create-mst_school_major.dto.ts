import { IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstSchoolMajorDto {
  @ApiProperty({
    type: String,
    description: "The ID of the school",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  school_id: string;

  @ApiProperty({
    type: String,
    description: "The ID of the major",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID()
  major_id: string;
}

