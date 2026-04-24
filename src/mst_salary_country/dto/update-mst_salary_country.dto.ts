// src\mst_skills\dto\update-mst_skill.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateMstSalaryCountryDto } from "./create-mst_salary_country.dto";

export class UpdateMstSalaryCountryDto extends PartialType(
  CreateMstSalaryCountryDto,
) {}
