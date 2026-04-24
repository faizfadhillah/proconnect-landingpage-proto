// src\user_SalaryCountrys\dto\update-user_SalaryCountry.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateUserSalaryCountryDto } from "./create-user_salary_country.dto";

export class UpdateUserSalaryCountryDto extends PartialType(
  CreateUserSalaryCountryDto,
) {}
