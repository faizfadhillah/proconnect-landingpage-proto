// src\user_SalaryCountry\user_SalaryCountry.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserSalaryCountryService } from "./user_salary_country.service";
import { UserSalaryCountryController } from "./user_salary_country.controller";
import { UserSalaryCountry } from "./entities/user_salary_country.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserSalaryCountry]), LogsModule],
  controllers: [UserSalaryCountryController],
  providers: [UserSalaryCountryService, FieldsService],
  exports: [UserSalaryCountryService, FieldsService],
})
export class UserSalaryCountryModule {}
