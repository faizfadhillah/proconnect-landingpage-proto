import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostsService } from "./posts.service";
import { PostsController } from "./posts.controller";
import { Post } from "./entities/post.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([Post]), LogsModule],
  controllers: [PostsController],
  providers: [PostsService, FieldsService],
  exports: [PostsService, FieldsService],
})
export class PostsModule {}
