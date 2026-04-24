import { Module } from "@nestjs/common";
import { StorageModule } from "src/storage/storage.module";
import { MediaController } from "./media.controller";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [StorageModule, LogsModule],
  controllers: [MediaController],
})
export class MediaModule {}
