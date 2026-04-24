import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QuestionnairesService } from "./questionnaires.service";
import { QuestionnairesController } from "./questionnaires.controller";
import { Questionnaire } from "./entities/questionnaire.entity";
import { FieldsModule } from "src/zfields/fields.module";

@Module({
  imports: [TypeOrmModule.forFeature([Questionnaire]), FieldsModule],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService],
  exports: [QuestionnairesService],
})
export class QuestionnairesModule {}
