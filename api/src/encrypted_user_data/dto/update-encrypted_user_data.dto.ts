import { PartialType } from "@nestjs/mapped-types";
import { CreateEncryptedUserDataDto } from "./create-encrypted_user_data.dto";
import { IsOptional } from "class-validator";

export class UpdateEncryptedUserDataDto extends PartialType(
  CreateEncryptedUserDataDto,
) {
  @IsOptional()
  updated_at: Date;

  @IsOptional()
  updated_by: string | null;
}
