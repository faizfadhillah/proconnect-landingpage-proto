import { PartialType } from "@nestjs/swagger";
import { CreateEducationLicenseMappingDto } from "./create-education-license-mapping.dto";

export class UpdateEducationLicenseMappingDto extends PartialType(
  CreateEducationLicenseMappingDto
) {}

