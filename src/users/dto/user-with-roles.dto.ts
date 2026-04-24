import { ApiProperty, OmitType } from "@nestjs/swagger";
import { User } from "../entities/user.entity";
import { RoleDto } from "./role.dto";

export class UserWithRolesDto extends OmitType(User, ['roles'] as const) {
  @ApiProperty({
    type: String,
    description: "Decrypted full phone number (may be null if not set)",
    nullable: true,
    required: false,
  })
  phone?: string | null;

  @ApiProperty({
    type: [RoleDto],
    description: "User roles with permissions",
  })
  roles: RoleDto[];
}