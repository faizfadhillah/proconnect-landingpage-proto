import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InvoicesItemsService } from "./invoices_items.service";
import { InvoicesItemsController } from "./invoices_items.controller";
import { InvoicesItem } from "./entities/invoices_item.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([InvoicesItem]), LogsModule],
  controllers: [InvoicesItemsController],
  providers: [InvoicesItemsService, FieldsService],
  exports: [InvoicesItemsService, FieldsService],
})
export class InvoicesItemsModule {}
