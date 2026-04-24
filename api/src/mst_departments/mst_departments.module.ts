import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstDepartmentsService } from "./mst_departments.service";
import { MstDepartmentsDao } from "./dao/mst_departments.dao";
import { MstDepartmentsController } from "./mst_departments.controller";
import { MstDepartment } from "./entities/mst_department.entity";
import { CompanyDepartmentMapModule } from "../company_department_map/company_department_map.module";
import { FieldsModule } from "src/zfields/fields.module";
import { UserRoleAssignmentsModule } from "../user_role_assignments/user_role_assignments.module";
import { LogsModule } from "src/logs/logs.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([MstDepartment]),
        forwardRef(() => CompanyDepartmentMapModule),
        forwardRef(() => UserRoleAssignmentsModule),
        FieldsModule,
        LogsModule,
    ],
    controllers: [MstDepartmentsController],
    providers: [MstDepartmentsService, MstDepartmentsDao],
    exports: [MstDepartmentsService, MstDepartmentsDao],
})
export class MstDepartmentsModule { }