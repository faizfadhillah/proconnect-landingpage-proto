import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BulkUploadService } from "./service/bulk-upload.service";
import { TemplateService } from "./service/template.service";
import { UploadBatch } from "./entity/upload_batch.entity";
import { UploadBatchRow } from "./entity/upload_batch_row.entity";
import { EmailLog } from "../notifications/email/entity/email_log.entity";
import { UsersModule } from "../users/users.module";
import { UploadBatchesDao } from "./dao/upload-batches.dao";
import { UploadBatchRowsDao } from "./dao/upload-batch-rows.dao";
import { BulkUploadController } from "./bulk-upload.controller";
import { NotificationModule } from "src/notifications/notifications.module";
import { AuthModule } from "src/auth/auth.module";
import { LogsModule } from "src/logs/logs.module";
import { FileParserUtil } from "./utils/file-parser.util";
import { DeleteBulkUploadService } from "./service/delete-bulk-upload.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([UploadBatch, UploadBatchRow, EmailLog]),
    UsersModule,
    NotificationModule,
    AuthModule,
    LogsModule,
  ],
  controllers: [BulkUploadController],
  providers: [
    BulkUploadService,
    TemplateService,
    UploadBatchesDao,
    UploadBatchRowsDao,
    FileParserUtil,
    DeleteBulkUploadService
  ],
  exports: [BulkUploadService],
})
export class BulkUploadUserCandidateModule {}