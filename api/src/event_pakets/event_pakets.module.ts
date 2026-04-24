import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventPaketsService } from "./event_pakets.service";
import { EventPaketsController } from "./event_pakets.controller";
import { EventPaket } from "./entities/event_paket.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([EventPaket]), LogsModule],
  controllers: [EventPaketsController],
  providers: [EventPaketsService, FieldsService],
  exports: [EventPaketsService, FieldsService],
})
export class EventPaketsModule {}
