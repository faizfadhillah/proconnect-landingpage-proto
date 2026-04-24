// src\user_career_history\user_career_history.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserCareerHistoryService } from "./user_career_history.service";
import { UserCareerHistoryController } from "./user_career_history.controller";
import { UserCareerHistory } from "./entities/user_career_history.entity";
import { FieldsService } from "src/zfields/fields.service";
import { MstProfession } from "src/mst_professions/entities/mst_profession.entity";
import { UserProfession } from "src/user_professions/entities/user_profession.entity";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserCareerHistory,
      MstProfession,
      UserProfession,
    ]),
    LogsModule,
  ],
  controllers: [UserCareerHistoryController],
  providers: [UserCareerHistoryService, FieldsService],
  exports: [UserCareerHistoryService, FieldsService],
})
export class UserCareerHistoryModule {}
