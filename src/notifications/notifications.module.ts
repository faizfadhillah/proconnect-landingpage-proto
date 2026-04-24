import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { HttpModule } from "@nestjs/axios";
import { EmailLog } from "./email/entity/email_log.entity";
import { UsersModule } from "../users/users.module";
import { EmailLogsDao } from "./email/dao/email-logs.dao";
import { EmailQueueProcessor } from "./email/service/email-queue.processor";
import { EmailService } from "./email/service/email.service";
import { QueueMonitoringService } from "./email/service/queue-monitoring.service";
import { QueueMonitoringController } from "./email/controller/queue-monitoring.controller";
import { MailjetWebhookController } from "./email/controller/mailjet-webhook.controller";
import { MailjetWebhookService } from "./email/service/mailjet-webhook.service";
import { EMAIL_QUEUE_NAMES } from "./email/constants/constants";
import { LogsModule } from "src/logs/logs.module";
import { ConfigsModule } from "src/config/config.module";
import { MessageCentralService } from "./sms/service/message-central.service";
import { NotificationRateLimitService } from "./service/notification-rate-limit.service";
import { NotificationRateLimitGuard } from "./guard/notification-rate-limit.guard";

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailLog]),
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAMES.SEND_EMAIL,
    }),
    HttpModule,
    forwardRef(() => UsersModule),
    LogsModule,
    ConfigsModule,
  ],
  controllers: [QueueMonitoringController, MailjetWebhookController],
  providers: [
    EmailQueueProcessor,
    EmailLogsDao,
    EmailService,
    QueueMonitoringService,
    MailjetWebhookService,
    MessageCentralService,
    NotificationRateLimitService,
    NotificationRateLimitGuard,
  ],
  exports: [
    EmailService,
    EmailLogsDao,
    MessageCentralService,
    NotificationRateLimitService,
    NotificationRateLimitGuard,
  ],
})
export class NotificationModule {}