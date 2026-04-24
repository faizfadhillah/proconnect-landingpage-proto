// src\user_skills\user_skills.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserLanguagesService } from "./user_languages.service";
import { UserLanguagesController } from "./user_languages.controller";
import { UserLanguage } from "./entities/user_language.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserLanguage]), LogsModule],
  controllers: [UserLanguagesController],
  providers: [UserLanguagesService, FieldsService],
  exports: [UserLanguagesService, FieldsService],
})
export class UserLanguagesModule {}
