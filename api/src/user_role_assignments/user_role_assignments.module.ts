import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserRoleAssignment } from "./entities/user_role_assignment.entity";
import { UserRoleAssignmentHistory } from "./entities/user_role_assignment_history.entity";
import { UserRoleAssignmentService } from "./services/user_role_assignments.service";

// Import related entities for validator dependencies
import { User } from "../users/entities/user.entity";
import { MstCompany } from "../mst_companies/entities/mst_company.entity";
import { MstDepartment } from "../mst_departments/entities/mst_department.entity";
import { MstProfession } from "../mst_professions/entities/mst_profession.entity";
import { EncryptedUserData } from "../encrypted_user_data/entities/encrypted_user_data.entity";
import { UserRoleAssignmentDao } from "./dao/user_role_assignment.dao";
import { UserRoleAssignmentHistoryDao } from "./dao/user_role_assignment_history.dao";
import { MstCompaniesModule } from "../mst_companies/mst_companies.module";
import { UserRoleAssignmentsController } from "./user_role_assignments.controller";
import { LogsModule } from "src/logs/logs.module";
import { UsersModule } from "src/users/users.module";
import { RbacModule } from "src/rbac/rbac.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRoleAssignment,
      UserRoleAssignmentHistory,
      User,
      MstCompany,
      MstDepartment,
      MstProfession,
      EncryptedUserData,
    ]),
    forwardRef(() => MstCompaniesModule),
    LogsModule,
    forwardRef(() => UsersModule),
    forwardRef(() => RbacModule),
  ],
  controllers: [UserRoleAssignmentsController],
  providers: [
    UserRoleAssignmentService,
    UserRoleAssignmentDao,
    UserRoleAssignmentHistoryDao,
  ],
  exports: [
    TypeOrmModule,
    UserRoleAssignmentService,
    UserRoleAssignmentDao,
    UserRoleAssignmentHistoryDao,
  ],
})
export class UserRoleAssignmentsModule { }