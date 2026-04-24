// src\mst_skills\dto\update-mst_skill.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateMstLanguageDto } from "./create-mst_language.dto";

export class UpdateMstLanguageDto extends PartialType(CreateMstLanguageDto) {}
