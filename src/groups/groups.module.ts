import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GroupsService } from "./groups.service";
import { GroupsController } from "./groups.controller";
import { Groups } from "./entities/groups.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([Groups]), LogsModule],
  controllers: [GroupsController],
  providers: [GroupsService, FieldsService],
  exports: [GroupsService, FieldsService],
})
export class GroupsModule {}
