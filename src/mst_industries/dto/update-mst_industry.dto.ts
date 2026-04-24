// src\mst_skills\dto\update-mst_skill.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateMstIndustryDto } from "./create-mst_industry.dto";

export class UpdateMstIndustryDto extends PartialType(CreateMstIndustryDto) {}
