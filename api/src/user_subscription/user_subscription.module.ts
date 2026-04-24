import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserSubscriptionService } from "./user_subscription.service";
import { UserSubscriptionController } from "./user_subscription.controller";
import { UserSubscription } from "./entities/user_subscription.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserSubscription]), LogsModule],
  controllers: [UserSubscriptionController],
  providers: [UserSubscriptionService, FieldsService],
  exports: [UserSubscriptionService, FieldsService],
})
export class UserSubscriptionModule {}
