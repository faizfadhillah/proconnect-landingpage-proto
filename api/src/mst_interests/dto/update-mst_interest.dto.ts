// src\mst_skills\dto\update-mst_skill.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateMstInterestDto } from "./create-mst_interest.dto";

export class UpdateMstInterestDto extends PartialType(CreateMstInterestDto) {}
