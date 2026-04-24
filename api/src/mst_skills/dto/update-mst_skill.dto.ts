// src\mst_skills\dto\update-mst_skill.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateMstSkillDto } from "./create-mst_skill.dto";

export class UpdateMstSkillDto extends PartialType(CreateMstSkillDto) {}
