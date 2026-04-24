import { Module } from "@nestjs/common";
import { FieldsController } from "./fields.controller";
import { FieldsService } from "./fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [LogsModule],
  controllers: [FieldsController],
  providers: [FieldsService],
  exports: [FieldsService],
})
export class FieldsModule {}
