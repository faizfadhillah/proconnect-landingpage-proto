import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstTagsService } from "./mst_tags.service";
import { MstTagsController } from "./mst_tags.controller";
import { MstTag } from "./entities/mst_tag.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstTag]), LogsModule],
  controllers: [MstTagsController],
  providers: [MstTagsService, FieldsService],
  exports: [MstTagsService, FieldsService],
})
export class MstTagsModule {}
