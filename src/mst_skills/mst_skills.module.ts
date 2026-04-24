// src\mst_skills\mst_skills.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstSkillsService } from "./mst_skills.service";
import { MstSkillsController } from "./mst_skills.controller";
import { MstSkill } from "./entities/mst_skill.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstSkill]), LogsModule],
  controllers: [MstSkillsController],
  providers: [MstSkillsService, FieldsService],
  exports: [MstSkillsService, FieldsService],
})
export class MstSkillsModule {}
