// src\mst_skills\mst_skills.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstIndustriesService } from "./mst_industries.service";
import { MstIndustriesController } from "./mst_industries.controller";
import { MstIndustry } from "./entities/mst_industry.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstIndustry]), LogsModule],
  controllers: [MstIndustriesController],
  providers: [MstIndustriesService, FieldsService],
  exports: [MstIndustriesService, FieldsService],
})
export class MstIndustriesModule {}
