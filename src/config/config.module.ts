import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigsService } from "./config.service";
import { ConfigsController } from "./config.controller";
import { Config } from "./entities/config.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([Config]), LogsModule],
  controllers: [ConfigsController],
  providers: [ConfigsService, FieldsService],
  exports: [ConfigsService, FieldsService],
})
export class ConfigsModule {}
