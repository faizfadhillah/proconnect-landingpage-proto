// src/company_files.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CompanyFilesService } from "./company_files.service";
import { CompanyFilesController } from "./company_files.controller";
import { CompanyFile } from "./entities/company_file.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([CompanyFile]), LogsModule],
  controllers: [CompanyFilesController],
  providers: [CompanyFilesService, FieldsService],
  exports: [CompanyFilesService, FieldsService],
})
export class CompanyFilesModule {}
