// src\mst_skills\mst_skills.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstSalaryCountryService } from "./mst_salary_country.service";
import { MstSalaryCountryController } from "./mst_salary_country.controller";
import { MstSalaryCountry } from "./entities/mst_salary_country.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstSalaryCountry]), LogsModule],
  controllers: [MstSalaryCountryController],
  providers: [MstSalaryCountryService, FieldsService],
  exports: [MstSalaryCountryService, FieldsService],
})
export class MstSalaryCountryModule {}
