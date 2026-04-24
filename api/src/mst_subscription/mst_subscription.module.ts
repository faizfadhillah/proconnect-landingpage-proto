import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstSubscriptionService } from "./mst_subscription.service";
import { MstSubscriptionController } from "./mst_subscription.controller";
import { MstSubscription } from "./entities/mst_subscription.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstSubscription]), LogsModule],
  controllers: [MstSubscriptionController],
  providers: [MstSubscriptionService, FieldsService],
  exports: [MstSubscriptionService, FieldsService],
})
export class MstSubscriptionModule {}
