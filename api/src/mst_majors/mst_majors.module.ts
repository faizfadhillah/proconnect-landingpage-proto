import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstMajorsService } from "./mst_majors.service";
import { MstMajorsController } from "./mst_majors.controller";
import { MstMajor } from "./entities/mst_major.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { MstMajorDao } from "./dao/mst_major.dao";

@Module({
  imports: [TypeOrmModule.forFeature([MstMajor]), LogsModule],
  controllers: [MstMajorsController],
  providers: [MstMajorsService, FieldsService, MstMajorDao],
  exports: [MstMajorsService, FieldsService, MstMajorDao],
})
export class MstMajorsModule {}