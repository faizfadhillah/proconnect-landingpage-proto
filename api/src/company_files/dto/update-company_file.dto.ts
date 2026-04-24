// src/dto/update-company_file.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateCompanyFileDto } from "./create-company_file.dto";

export class UpdateCompanyFileDto extends PartialType(CreateCompanyFileDto) {}
