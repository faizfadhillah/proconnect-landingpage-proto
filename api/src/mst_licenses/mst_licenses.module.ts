import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstLicensesService } from "./mst_licenses.service";
import { MstLicensesController } from "./mst_licenses.controller";
import { MstLicense } from "./entities/mst_license.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { MstLicenseDao } from "./dao/mst_license.dao";
import { ConfigsModule } from "../config/config.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstLicense]), LogsModule, ConfigsModule],
  controllers: [MstLicensesController],
  providers: [MstLicensesService, FieldsService, MstLicenseDao],
  exports: [MstLicensesService, FieldsService, MstLicenseDao],
})
export class MstLicensesModule {}