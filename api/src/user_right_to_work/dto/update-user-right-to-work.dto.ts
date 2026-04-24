// src/user_right_to_work/dto/update-user-right-to-work.dto.ts
import { PartialType } from "@nestjs/swagger";
import { CreateUserRightToWorkDto } from "./create-user-right-to-work.dto";

export class UpdateUserRightToWorkDto extends PartialType(
  CreateUserRightToWorkDto,
) {}
