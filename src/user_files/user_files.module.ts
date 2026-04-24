import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserFilesService } from "./user_files.service";
import { UserFilesController } from "./user_files.controller";
import { UserFile } from "./entities/user_file.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserFile]), LogsModule],
  controllers: [UserFilesController],
  providers: [UserFilesService, FieldsService],
  exports: [UserFilesService, FieldsService],
})
export class UserFilesModule {}
