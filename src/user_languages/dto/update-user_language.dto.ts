// src\user_skills\dto\update-user_skill.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateUserLanguageDto } from "./create-user_language.dto";

export class UpdateUserLanguageDto extends PartialType(CreateUserLanguageDto) {}
