// src\mst_skills\mst_skills.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstInterestsService } from "./mst_interests.service";
import { MstInterestsController } from "./mst_interests.controller";
import { MstInterest } from "./entities/mst_interest.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstInterest]), LogsModule],
  controllers: [MstInterestsController],
  providers: [MstInterestsService, FieldsService],
  exports: [MstInterestsService, FieldsService],
})
export class MstInterestsModule {}
