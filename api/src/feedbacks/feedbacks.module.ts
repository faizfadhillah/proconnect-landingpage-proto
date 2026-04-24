import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FeedbacksService } from "./feedbacks.service";
import { FeedbacksController } from "./feedbacks.controller";
import { Feedback } from "./entities/feedback.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { UsersModule } from "src/users/users.module";
import { User } from "src/users/entities/user.entity";
import { ConfigsModule } from "src/config/config.module";
import { EncryptedUserDataModule } from "src/encrypted_user_data/encrypted_user_data.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Feedback, User]),
    LogsModule,
    UsersModule,
    ConfigsModule,
    EncryptedUserDataModule,
  ],
  controllers: [FeedbacksController],
  providers: [FeedbacksService, FieldsService],
  exports: [FeedbacksService, FieldsService],
})
export class FeedbacksModule {}
