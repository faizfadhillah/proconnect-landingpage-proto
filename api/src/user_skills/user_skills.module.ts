// src\user_skills\user_skills.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserSkillsService } from "./user_skills.service";
import { UserSkillsController } from "./user_skills.controller";
import { UserSkill } from "./entities/user_skill.entity";
import { UserSkillDao } from "./dao/user_skill.dao";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { QueuePublishersModule } from "src/queues/publishers/queue-publishers.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSkill]),
    QueuePublishersModule,
    LogsModule,
  ],
  controllers: [UserSkillsController],
  providers: [UserSkillsService, UserSkillDao, FieldsService],
  exports: [UserSkillsService, FieldsService],
})
export class UserSkillsModule {}
