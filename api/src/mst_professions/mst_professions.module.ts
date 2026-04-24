// src\mst_professions\mst_professions.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstProfessionsService } from "./mst_professions.service";
import { MstProfessionsController } from "./mst_professions.controller";
import { MstProfession } from "./entities/mst_profession.entity";
import { FieldsService } from "../zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstProfession]), LogsModule],
  controllers: [MstProfessionsController],
  providers: [MstProfessionsService, FieldsService],
  exports: [MstProfessionsService, FieldsService],
})
export class MstProfessionsModule {}
