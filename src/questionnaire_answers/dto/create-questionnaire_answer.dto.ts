import {
  IsUUID,
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateQuestionnaireAnswerDto {
  @ApiProperty({
    type: String,
    description: "The id of the questionnaire",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  questionnaire_id: string;

  @ApiProperty({
    type: String,
    description: "The id of the job step",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  job_step_id: string;

  @ApiProperty({
    type: String,
    description: "The id of the applicant step",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  applicant_job_step_id: string;

  @ApiProperty({
    type: String,
    description: "The id of the job",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  job_id: string;

  @ApiProperty({
    type: Number,
    description: "The question number",
    example: 2,
  })
  @IsNumber()
  no: number;

  @ApiProperty({
    type: String,
    description: "The type of the question",
    example: "RADIO-BUTTON",
  })
  @IsString()
  type: string;

  @ApiProperty({
    type: String,
    description: "The question text",
    example:
      "EDITED:Berapa lama pengalaman Anda bekerja di posisi chef atau posisi serupa?",
  })
  @IsString()
  question: string;

  @ApiProperty({
    type: Object,
    description: "The options for the question (JSON)",
    example: [
      "Kurang dari 1 tahun",
      "1-3 tahun",
      "3-5 tahun",
      "Lebih dari 5 tahun",
    ],
  })
  @IsOptional()
  @IsArray()
  options?: any;

  @ApiProperty({
    type: Object,
    description: "The answer value (JSON)",
    example: ["3-5 tahun"],
  })
  @IsOptional()
  value?: any;
}
