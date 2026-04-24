// src\user_Interests\user_Interests.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserInterestsService } from "./user_interests.service";
import { UserInterestsController } from "./user_interests.controller";
import { UserInterest } from "./entities/user_interest.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserInterest]), LogsModule],
  controllers: [UserInterestsController],
  providers: [UserInterestsService, FieldsService],
  exports: [UserInterestsService, FieldsService],
})
export class UserInterestsModule {}
