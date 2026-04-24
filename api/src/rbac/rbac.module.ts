import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RbacService } from "./rbac.service";
import { RbacController } from "./rbac.controller";
import { Rbac } from "./entities/rbac.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { RbacGuard } from "./rbac.guard";
import { RbacDao } from "./dao/rbac.dao";
import { UserRoleAssignmentsModule } from "src/user_role_assignments/user_role_assignments.module";
import { ScopeFilterService } from "./scope-filter.service";
import { ScopeFilterDao } from "./dao/scope-filter.dao";
import { CompanyDepartmentMap } from "src/company_department_map/entities/company_department_map.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Rbac, CompanyDepartmentMap]),
    LogsModule, forwardRef(() => UserRoleAssignmentsModule)
  ],
  controllers: [RbacController],
  providers: [
    RbacService,
    FieldsService,
    RbacGuard,
    RbacDao,
    ScopeFilterService,
    ScopeFilterDao,
  ],
  exports: [RbacService, FieldsService, RbacGuard, ScopeFilterService],
})
export class RbacModule { }
