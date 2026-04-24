// src\jobs\jobs.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JobsService } from "./services/jobs.service";
import { JobsController } from "./jobs.controller";
import { SkillMatchController } from "./skill-match.controller";
import { Job } from "./entities/job.entity";
import { FieldsService } from "src/zfields/fields.service";
import { LogsModule } from "src/logs/logs.module";
import { NotificationModule } from "src/firebase/firebase.module";
import { UsersModule } from "src/users/users.module";
import { Applicant } from "src/applicants/entities/applicant.entity";
import { JobStep } from "src/job_steps/entities/job_step.entity";
import { RbacModule } from "src/rbac/rbac.module";
import { MstCompaniesModule } from "src/mst_companies/mst_companies.module";
import { CompanyDepartmentMapModule } from "src/company_department_map/company_department_map.module";
import { UserSkillsModule } from "src/user_skills/user_skills.module";
import { MstEducationProfessionMappingsModule } from "src/mst_education_profession_mappings/mst_education_profession_mappings.module";
import { UserEducationsModule } from "src/user_educations/user_educations.module";
import { MstMajorsModule } from "src/mst_majors/mst_majors.module";
import { JobSkillMatchService } from "./services/job-skill-match.service";
import { JobOpeningScheduleService } from "./services/job-opening-schedule.service";
import { JobsDao } from "./dao/jobs.dao";
import { UserSkill } from "src/user_skills/entities/user_skill.entity";
import { UserEducation } from "src/user_educations/entities/user_education.entity";
import { User } from "src/users/entities/user.entity";
import { MstSkill } from "src/mst_skills/entities/mst_skill.entity";
import { MstProfession } from "src/mst_professions/entities/mst_profession.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Applicant, JobStep, UserSkill, UserEducation, User, MstSkill, MstProfession]),
    LogsModule,
    NotificationModule,
    UsersModule,
    RbacModule,
    MstCompaniesModule,
    CompanyDepartmentMapModule,
    UserSkillsModule,
    MstEducationProfessionMappingsModule,
    UserEducationsModule,
    MstMajorsModule,
  ],
  controllers: [JobsController, SkillMatchController],
  providers: [JobsService, FieldsService, JobSkillMatchService, JobOpeningScheduleService, JobsDao],
  exports: [JobsService, FieldsService, JobSkillMatchService],
})
export class JobsModule {}
