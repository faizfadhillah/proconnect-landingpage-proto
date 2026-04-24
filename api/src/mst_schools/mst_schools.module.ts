// src\mst_educations\mst_educations.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstSchoolsService } from "./mst_schools.service";
import { MstSchoolsController } from "./mst_schools.controller";
import { MstSchool } from "./entities/mst_school.entity";
import { MstSchoolDao } from "./dao/mst_school.dao";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstSchool]), LogsModule],
  controllers: [MstSchoolsController],
  providers: [MstSchoolsService, MstSchoolDao, FieldsService],
  exports: [MstSchoolsService, MstSchoolDao, FieldsService],
})
export class MstSchoolsModule {}
