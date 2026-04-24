import {
  IsUUID,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateQuestionnaireDto {
  @ApiProperty({
    type: String,
    description: "The id of the job step",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  job_step_id: string;

  @ApiProperty({
    type: Number,
    description: "The number of the question",
    example: 2,
  })
  @IsNumber()
  no: number;

  @ApiProperty({
    type: String,
    description: "The type of the question",
    example: "RADIO-BUTTON",
    maxLength: 64,
  })
  @IsString()
  type: string;

  @ApiProperty({
    type: String,
    description: "The question text",
    example:
      "Berapa lama pengalaman Anda bekerja di posisi chef atau posisi serupa?",
  })
  @IsString()
  question: string;

  @ApiProperty({
    type: Object,
    description: "The options for the question in JSON format",
    example: [
      "Kurang dari 1 tahun",
      "1-3 tahun",
      "3-5 tahun",
      "Lebih dari 5 tahun",
    ],
  })
  @IsArray()
  @IsOptional()
  options?: any;

  @ApiProperty({
    type: Boolean,
    description: "Whether the question is required",
    example: true,
    default: false,
    required: true,
  })
  @IsBoolean()
  is_required?: boolean;
}
