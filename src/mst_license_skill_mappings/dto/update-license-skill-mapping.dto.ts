import { PartialType } from "@nestjs/swagger";
import { CreateLicenseSkillMappingDto } from "./create-license-skill-mapping.dto";

export class UpdateLicenseSkillMappingDto extends PartialType(
  CreateLicenseSkillMappingDto
) {}

