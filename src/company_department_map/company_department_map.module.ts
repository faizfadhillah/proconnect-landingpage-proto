import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CompanyDepartmentMapService } from "./company_department_map.service";
import { CompanyDepartmentMapDao } from "./dao/company_department_map.dao";
import { CompanyDepartmentMap } from "./entities/company_department_map.entity";
import { MstDepartmentsModule } from "../mst_departments/mst_departments.module";
import { MstCompaniesModule } from "../mst_companies/mst_companies.module";
import { UserRoleAssignmentsModule } from "../user_role_assignments/user_role_assignments.module";
import { LogsModule } from "src/logs/logs.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([CompanyDepartmentMap]),
        forwardRef(() => MstDepartmentsModule),
        forwardRef(() => MstCompaniesModule),
        forwardRef(() => UserRoleAssignmentsModule),
        LogsModule,
    ],
    providers: [CompanyDepartmentMapService, CompanyDepartmentMapDao],
    exports: [
        CompanyDepartmentMapService,
        CompanyDepartmentMapDao
    ],
})
export class CompanyDepartmentMapModule { }