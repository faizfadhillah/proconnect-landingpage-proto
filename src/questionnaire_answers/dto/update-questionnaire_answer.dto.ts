import { PartialType } from "@nestjs/mapped-types";
import { CreateQuestionnaireAnswerDto } from "./create-questionnaire_answer.dto";

export class UpdateQuestionnaireAnswerDto extends PartialType(
  CreateQuestionnaireAnswerDto,
) {}
