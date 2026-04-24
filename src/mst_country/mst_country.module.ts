// src\mst_skills\mst_skills.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstCountryService } from "./mst_country.service";
import { MstCountryController } from "./mst_country.controller";
import { MstCountry } from "./entities/mst_country.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstCountry]), LogsModule],
  controllers: [MstCountryController],
  providers: [MstCountryService, FieldsService],
  exports: [MstCountryService, FieldsService],
})
export class MstCountryModule {}
