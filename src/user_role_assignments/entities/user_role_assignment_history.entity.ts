import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { UserRoleAssignmentBase } from "./user_role_assignment_base.entity";
import { UserRoleAssignment } from "./user_role_assignment.entity";

@Entity("user_role_assignment_history")
@Unique("UQ_user_role_assignment_history_combination", ["userId", "companyHqId", "companyId", "deptId"])
export class UserRoleAssignmentHistory extends UserRoleAssignmentBase {
  @Column({ name: "role_assignment_id", type: "uuid", nullable: true })
  roleAssignmentId: string | null;

  @ManyToOne(() => UserRoleAssignment, { nullable: true })
  @JoinColumn({ name: "role_assignment_id" })
  roleAssignment: UserRoleAssignment | null;
}