// src/mst-companies/mst-companies.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstCompaniesService } from "./service/mst_companies.service";
import { MstCompaniesController } from "./mst_companies.controller";
import { MstCompany } from "./entities/mst_company.entity";
import { FieldsService } from "src/zfields/fields.service";
import { User } from "src/users/entities/user.entity";
import { EncryptedUserData } from "src/encrypted_user_data/entities/encrypted_user_data.entity";
import { LogsModule } from "src/logs/logs.module";
import { MailjetService } from "src/users/mailjet.service";
import { MstIndustry } from "src/mst_industries/entities/mst_industry.entity";
import { ConfigsModule } from "src/config/config.module";
import { UserRoleAssignmentsModule } from "src/user_role_assignments/user_role_assignments.module";
import { CompanyDepartmentMapModule } from "src/company_department_map/company_department_map.module";
import { NotificationModule } from "src/firebase/firebase.module";
import { UsersModule } from "src/users/users.module";
import { EncryptedUserDataModule } from "src/encrypted_user_data/encrypted_user_data.module";
import { MstCompanyHqBranchRelationService } from "./service/company_hq_branch_relation.service";
import { MstCompanyMemberService } from "./service/company_member.service";
import { HqTransferOwnershipService } from "./service/hq_transfer_ownership.service";
import { MstCompaniesUtils } from "./mst_companies.utils";
import { MstCountry } from "src/mst_country/entities/mst_country.entity";
import { MstRegion } from "src/mst_regions/entities/mst_region.entity";
import { HqBranchMirrorService } from "./service/hq_branch_mirror.service";
import { MstCompaniesDao } from "./dao/mst_companies.dao";
import { RbacModule } from "src/rbac/rbac.module";
import { MstDepartmentsModule } from "src/mst_departments/mst_departments.module";
import { PublicMstCompaniesController } from "./public-mst_companies.controller";
import { Job } from "src/jobs/entities/job.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MstCompany,
      User,
      EncryptedUserData,
      MstIndustry,
      MstRegion,
      MstCountry,
      Job,
    ]),
    LogsModule,
    ConfigsModule,
    forwardRef(() => UserRoleAssignmentsModule),
    forwardRef(() => CompanyDepartmentMapModule),
    NotificationModule,
    forwardRef(() => UsersModule),
    EncryptedUserDataModule,
    MstDepartmentsModule,
    forwardRef(() => RbacModule),
  ],
  controllers: [MstCompaniesController, PublicMstCompaniesController],
  providers: [MstCompaniesService,
    FieldsService,
    MailjetService,
    MstCompanyHqBranchRelationService,
    MstCompanyMemberService,
    HqTransferOwnershipService,
    MstCompaniesUtils,
    HqBranchMirrorService,
    MstCompaniesDao],
  exports: [MstCompaniesService,
    FieldsService,
    MailjetService,
    MstCompanyHqBranchRelationService,
    MstCompanyMemberService,
    HqTransferOwnershipService,
    HqBranchMirrorService,
    MstCompaniesDao],
})
export class MstCompaniesModule { }
