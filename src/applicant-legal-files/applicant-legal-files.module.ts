// src\applicant-legal-files\applicant-legal-files.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicantLegalFilesService } from "./applicant-legal-files.service";
import { ApplicantLegalFilesController } from "./applicant-legal-files.controller";
import { ApplicantLegalFile } from "./entities/applicant-legal-file.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([ApplicantLegalFile]), LogsModule],
  controllers: [ApplicantLegalFilesController],
  providers: [ApplicantLegalFilesService, FieldsService],
  exports: [ApplicantLegalFilesService, FieldsService],
})
export class ApplicantLegalFilesModule {}
