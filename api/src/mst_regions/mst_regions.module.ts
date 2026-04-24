// src/mst-regions/mst-regions.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstRegionsService } from "./mst_regions.service";
import { MstRegionsController } from "./mst_regions.controller";
import { MstRegion } from "./entities/mst_region.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstRegion]), LogsModule],
  controllers: [MstRegionsController],
  providers: [MstRegionsService, FieldsService],
  exports: [MstRegionsService, FieldsService],
})
export class MstRegionsModule {}
