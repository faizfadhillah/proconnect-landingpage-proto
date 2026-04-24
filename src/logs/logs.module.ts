import { Module } from "@nestjs/common";
import { LoggingService } from "./logs.service";

@Module({
  providers: [LoggingService],
  exports: [LoggingService],
})
export class LogsModule {}
