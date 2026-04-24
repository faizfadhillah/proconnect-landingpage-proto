// src\mst_skills\dto\update-mst_skill.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateMstCountryDto } from "./create-mst_country.dto";

export class UpdateMstCountryDto extends PartialType(CreateMstCountryDto) {}
