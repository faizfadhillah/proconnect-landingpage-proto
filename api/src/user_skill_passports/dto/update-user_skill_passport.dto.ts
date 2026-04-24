// src\user_SkillPassports\dto\update-user_SkillPassport.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateUserSkillPassportDto } from "./create-user_skill_passport.dto";

export class UpdateUserSkillPassportDto extends PartialType(
  CreateUserSkillPassportDto,
) {}
