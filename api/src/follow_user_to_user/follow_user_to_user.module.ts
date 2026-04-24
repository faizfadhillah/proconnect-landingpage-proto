import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FollowUserToUserService } from "./follow_user_to_user.service";
import { FollowUserToUserController } from "./follow_user_to_user.controller";
import { FollowUserToUser } from "./entities/follow_user_to_user.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([FollowUserToUser]), LogsModule],
  controllers: [FollowUserToUserController],
  providers: [FollowUserToUserService, FieldsService],
  exports: [FollowUserToUserService, FieldsService],
})
export class FollowUserToUserModule {}
