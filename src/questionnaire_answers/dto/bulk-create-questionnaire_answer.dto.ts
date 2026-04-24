import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { CreateQuestionnaireAnswerDto } from "./create-questionnaire_answer.dto";

export class BulkCreateQuestionnaireAnswerDto {
  @ApiProperty({
    type: [CreateQuestionnaireAnswerDto],
    description: "Array of questionnaire answers to create",
    example: [
      {
        questionnaire_id: "12345678-1234-1234-1234-1234567890ab",
        job_step_id: "12345678-1234-1234-1234-1234567890ab",
        applicant_job_step_id: "12345678-1234-1234-1234-1234567890ab",
        job_id: "12345678-1234-1234-1234-1234567890ab",
        no: 1,
        type: "RADIO-BUTTON",
        question: "Berapa lama pengalaman Anda bekerja?",
        options: [
          "Kurang dari 1 tahun",
          "1-3 tahun",
          "3-5 tahun",
          "Lebih dari 5 tahun",
        ],
        value: ["3-5 tahun"],
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionnaireAnswerDto)
  data: CreateQuestionnaireAnswerDto[];
}
