import { ApiProperty } from "@nestjs/swagger";
import { Rbac } from "src/rbac/entities/rbac.entity";
import { PermissionMeta } from "src/rbac/interfaces/scope-info.interface";
import { UserRoleAssignmentHistoryResponseDto } from "src/user_role_assignments/dto/user_role_assignment_history_response.dto";

export class UserRolePermissionDto {
  @ApiProperty({
    type: String,
    description: "Permission name",
  })
  permission: string;

  @ApiProperty({
    type: String,
    description: "Permission level",
  })
  level: string;

  @ApiProperty({
    type: String,
    description: "Permission description",
  })
  description: string;

  @ApiProperty({
    type: String,
    description: "Branch scope",
    nullable: true,
  })
  branch_scope?: string;

  @ApiProperty({
    type: String,
    description: "Department scope",
    nullable: true,
  })
  dept_scope?: string;

  static fromRbac(rbac: Rbac): UserRolePermissionDto {
    const meta: PermissionMeta | null = rbac.meta
      ? (typeof rbac.meta === 'string'
          ? JSON.parse(rbac.meta)
          : rbac.meta)
      : null;

    return {
      permission: rbac.name,
      level: meta?.level || null,
      description: rbac.description,
      branch_scope: meta?.branch_scope,
      dept_scope: meta?.dept_scope,
    };
  }
}

export class RoleDto {
  @ApiProperty({
    type: UserRoleAssignmentHistoryResponseDto,
    description: "Role assignment history",
  })
  assignment: UserRoleAssignmentHistoryResponseDto;

  @ApiProperty({
    type: [UserRolePermissionDto],
    description: "Permissions for the role assignment",
  })
  permissions: UserRolePermissionDto[];
}
