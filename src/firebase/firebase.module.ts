import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FirebaseService } from "./firebase.service";
import { FirebaseController } from "./firebase.controller";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { User } from "../users/entities/user.entity";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    LogsModule,
    TypeOrmModule.forFeature([User]),
    forwardRef(() => UsersModule),
  ],
  controllers: [FirebaseController],
  providers: [FirebaseService, FieldsService],
  exports: [FirebaseService, FieldsService],
})
export class NotificationModule {}
