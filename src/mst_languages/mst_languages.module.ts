// src\mst_skills\mst_skills.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstLanguagesService } from "./mst_languages.service";
import { MstLanguagesController } from "./mst_languages.controller";
import { MstLanguage } from "./entities/mst_language.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstLanguage]), LogsModule],
  controllers: [MstLanguagesController],
  providers: [MstLanguagesService, FieldsService],
  exports: [MstLanguagesService, FieldsService],
})
export class MstLanguagesModule {}
