import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FollowUserToCompaniesService } from "./follow_user_to_companies.service";
import { FollowUserToCompaniesController } from "./follow_user_to_companies.controller";
import { FollowUserToCompanies } from "./entities/follow_user_to_companies.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([FollowUserToCompanies]), LogsModule],
  controllers: [FollowUserToCompaniesController],
  providers: [FollowUserToCompaniesService, FieldsService],
  exports: [FollowUserToCompaniesService, FieldsService],
})
export class FollowUserToCompaniesModule {}
