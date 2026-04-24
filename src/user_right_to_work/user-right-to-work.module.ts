// src/user_right_to_work/user-right-to-work.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserRightToWorkService } from "./user-right-to-work.service";
import { UserRightToWorkController } from "./user-right-to-work.controller";
import { UserRightToWork } from "./entities/user-right-to-work.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserRightToWork]), LogsModule],
  controllers: [UserRightToWorkController],
  providers: [UserRightToWorkService, FieldsService],
  exports: [UserRightToWorkService, FieldsService],
})
export class UserRightToWorkModule {}
