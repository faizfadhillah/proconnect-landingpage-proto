// src/mst-companies/dto/update-mst-company.dto.ts
import { PartialType } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  Length,
} from "class-validator";
import { CreateMstCompanyDto } from "./create-mst_company.dto";

export class UpdateMstCompanyDto extends PartialType(CreateMstCompanyDto) {
  @IsOptional()
  @IsString()
  @Length(0, 255)
  business_license?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  tax_identification_number?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  tax_identification_url?: string;
}
