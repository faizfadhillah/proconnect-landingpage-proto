import { PartialType } from "@nestjs/swagger";
import { CreateEducationProfessionMappingDto } from "./create-education-profession-mapping.dto";

export class UpdateEducationProfessionMappingDto extends PartialType(
  CreateEducationProfessionMappingDto
) {}

