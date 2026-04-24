import { Module } from "@nestjs/common";
import { MstRightToWorksService } from "./mst_right_to_works.service";
import { MstRightToWorksController } from "./mst_right_to_works.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstRightToWork } from "./entities/mst_right_to_work.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([MstRightToWork]), LogsModule],
  controllers: [MstRightToWorksController],
  providers: [MstRightToWorksService, FieldsService],
})
export class MstRightToWorksModule {}
