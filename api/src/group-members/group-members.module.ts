import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GroupMembersService } from "./group-members.service";
import { GroupMembersController } from "./group-members.controller";
import { GroupMembers } from "./entities/group-members.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([GroupMembers]), LogsModule],
  controllers: [GroupMembersController],
  providers: [GroupMembersService, FieldsService],
  exports: [GroupMembersService, FieldsService],
})
export class GroupMembersModule {}
