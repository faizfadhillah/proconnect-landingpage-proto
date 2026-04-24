import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MstDepartment } from 'src/mst_departments/entities/mst_department.entity';
import { MstProfession } from 'src/mst_professions/entities/mst_profession.entity';
import { CompanyDepartmentMap } from 'src/company_department_map/entities/company_department_map.entity';
import { User } from 'src/users/entities/user.entity';
import { UserRoleAssignment } from 'src/user_role_assignments/entities/user_role_assignment.entity';
import { UserEducation } from 'src/user_educations/entities/user_education.entity';
import { MstMajor } from 'src/mst_majors/entities/mst_major.entity';
import { MstCompaniesModule } from 'src/mst_companies/mst_companies.module';
import { MstDepartmentsModule } from 'src/mst_departments/mst_departments.module';
import { CompanyDepartmentMapModule } from 'src/company_department_map/company_department_map.module';
import { UsersModule } from 'src/users/users.module';
import { UserRoleAssignmentsModule } from 'src/user_role_assignments/user_role_assignments.module';
import { EncryptedUserDataModule } from 'src/encrypted_user_data/encrypted_user_data.module';
import { ReleaseDataMigrationService } from './services/release-data-migration.service';
import { DataMigrationController } from './datamigration.controller';
import { MigrationService } from './services/migration.service';
import { MigrationDao } from './dao/migration.dao';
import { RoleAssignmentHelperService } from './services/role-assignment-helper.service';
import { LogsModule } from 'src/logs/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MstDepartment,
      MstProfession,
      CompanyDepartmentMap,
      User,
      UserRoleAssignment,
      UserEducation,
      MstMajor,
    ]),
    MstCompaniesModule,
    MstDepartmentsModule,
    CompanyDepartmentMapModule,
    UsersModule,
    UserRoleAssignmentsModule,
    EncryptedUserDataModule,
    LogsModule,
  ],
  controllers: [DataMigrationController],
  providers: [ReleaseDataMigrationService, MigrationService, MigrationDao, RoleAssignmentHelperService],
  exports: [ReleaseDataMigrationService],
})
export class DataMigrationModule {}

