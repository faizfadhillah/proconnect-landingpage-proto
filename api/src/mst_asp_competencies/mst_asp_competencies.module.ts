import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstAspCompetenciesService } from "./mst_asp_competencies.service";
import { MstAspCompetenciesController } from "./mst_asp_competencies.controller";
import { MstAspCompetency } from "./entities/mst_asp_competency.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstAspCompetency]), LogsModule],
  controllers: [MstAspCompetenciesController],
  providers: [MstAspCompetenciesService, FieldsService],
  exports: [MstAspCompetenciesService, FieldsService],
})
export class MstAspCompetenciesModule {}
