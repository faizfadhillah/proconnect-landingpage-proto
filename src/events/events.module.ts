import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventsService } from "./events.service";
import { EventsController } from "./events.controller";
import { Event } from "./entities/event.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([Event]), LogsModule],
  controllers: [EventsController],
  providers: [EventsService, FieldsService],
  exports: [EventsService, FieldsService],
})
export class EventsModule {}
