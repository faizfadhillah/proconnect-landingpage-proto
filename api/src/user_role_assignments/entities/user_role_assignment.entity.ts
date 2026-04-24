import { Entity } from "typeorm";
import { UserRoleAssignmentBase } from "./user_role_assignment_base.entity";

@Entity("user_role_assignments")
export class UserRoleAssignment extends UserRoleAssignmentBase {}