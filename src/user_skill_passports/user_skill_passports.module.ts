// src\user_SkillPassports\user_SkillPassports.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserSkillPassportsService } from "./user_skill_passports.service";
import { UserSkillPassportsController } from "./user_skill_passports.controller";
import { UserSkillPassport } from "./entities/user_skill_passport.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { User } from "src/users/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserSkillPassport, User]), LogsModule],
  controllers: [UserSkillPassportsController],
  providers: [UserSkillPassportsService, FieldsService],
  exports: [UserSkillPassportsService, FieldsService],
})
export class UserSkillPassportsModule {}
