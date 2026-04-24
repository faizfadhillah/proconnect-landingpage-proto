import { IsArray, ValidateNested, IsUUID } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { UpdateQuestionnaireAnswerDto } from "./update-questionnaire_answer.dto";

export class BulkUpdateQuestionnaireAnswerItemDto extends UpdateQuestionnaireAnswerDto {
  @ApiProperty({
    type: String,
    description: "The ID of the questionnaire answer to update",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  id: string;
}

export class BulkUpdateQuestionnaireAnswerDto {
  @ApiProperty({
    type: [BulkUpdateQuestionnaireAnswerItemDto],
    description: "Array of questionnaire answers to update",
    example: [
      {
        id: "12345678-1234-1234-1234-1234567890ab",
        question: "Updated question text",
        value: ["Updated answer"],
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateQuestionnaireAnswerItemDto)
  data: BulkUpdateQuestionnaireAnswerItemDto[];
}
