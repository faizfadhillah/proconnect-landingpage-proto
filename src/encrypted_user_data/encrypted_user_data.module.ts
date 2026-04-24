import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EncryptedUserDataService } from "./encrypted_user_data.service";
import { EncryptedUserDataController } from "./encrypted_user_data.controller";
import { EncryptedUserData } from "./entities/encrypted_user_data.entity";
import { FieldsService } from "src/zfields/fields.service";
import { User } from "src/users/entities/user.entity";
import { LogsModule } from "src/logs/logs.module";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([EncryptedUserData, User]),
    LogsModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [EncryptedUserDataController],
  providers: [EncryptedUserDataService, FieldsService],
  exports: [EncryptedUserDataService, FieldsService],
})
export class EncryptedUserDataModule {}
