import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstSchoolMajorsService } from "./mst_school_majors.service";
import { MstSchoolMajorsController } from "./mst_school_majors.controller";
import { MstSchoolMajor } from "./entities/mst_school_major.entity";
import { MstSchool } from "src/mst_schools/entities/mst_school.entity";
import { MstMajor } from "src/mst_majors/entities/mst_major.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { MstSchoolMajorDao } from "./dao/mst_school_major.dao";

@Module({
  imports: [
    TypeOrmModule.forFeature([MstSchoolMajor, MstSchool, MstMajor]),
    LogsModule,
  ],
  controllers: [MstSchoolMajorsController],
  providers: [MstSchoolMajorsService, FieldsService, MstSchoolMajorDao],
  exports: [MstSchoolMajorsService, FieldsService, MstSchoolMajorDao],
})
export class MstSchoolMajorsModule {}

