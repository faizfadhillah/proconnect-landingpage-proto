// src\user_professions\user_professions.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserProfessionsService } from "./user_professions.service";
import { UserProfessionsController } from "./user_professions.controller";
import { UserProfession } from "./entities/user_profession.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserProfession]), LogsModule],
  controllers: [UserProfessionsController],
  providers: [UserProfessionsService, FieldsService],
  exports: [UserProfessionsService, FieldsService],
})
export class UserProfessionsModule {}
