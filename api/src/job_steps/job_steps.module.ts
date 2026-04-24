import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JobStepsService } from "./job_steps.service";
import { JobStepsController } from "./job_steps.controller";
import { JobStep } from "./entities/job_step.entity";
import { FieldsService } from "src/zfields/fields.service";
import { Job } from "src/jobs/entities/job.entity";
import { RbacModule } from "src/rbac/rbac.module";
import { MstCompaniesModule } from "src/mst_companies/mst_companies.module";
import { CompanyDepartmentMapModule } from "src/company_department_map/company_department_map.module";
import { LogsModule } from "src/logs/logs.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([JobStep, Job]),
    RbacModule,
    MstCompaniesModule,
    CompanyDepartmentMapModule,
    LogsModule,
  ],
  controllers: [JobStepsController],
  providers: [JobStepsService, FieldsService],
  exports: [JobStepsService, FieldsService],
})
export class JobStepsModule {}
