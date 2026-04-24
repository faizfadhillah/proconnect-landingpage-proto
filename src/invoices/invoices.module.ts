import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InvoicesService } from "./invoices.service";
import { InvoicesController } from "./invoices.controller";
import { Invoice } from "./entities/invoice.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([Invoice]), LogsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, FieldsService],
  exports: [InvoicesService, FieldsService],
})
export class InvoicesModule {}
