import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MstEducationProfessionMappingsService } from "./mst_education_profession_mappings.service";
import { MstEducationProfessionMappingsController } from "./mst_education_profession_mappings.controller";
import { MstEducationProfessionMapping } from "./entities/mst_education_profession_mapping.entity";
import { MstSchool } from "../mst_schools/entities/mst_school.entity";
import { MstMajor } from "../mst_majors/entities/mst_major.entity";
import { MstProfession } from "../mst_professions/entities/mst_profession.entity";
import { User } from "../users/entities/user.entity";
import { MstEducationProfessionMappingDao } from "./dao/mst_education_profession_mapping.dao";
import { MstSchoolsModule } from "../mst_schools/mst_schools.module";
import { MstMajorsModule } from "../mst_majors/mst_majors.module";
import { MstProfessionsModule } from "../mst_professions/mst_professions.module";
import { ConfigsModule } from "../config/config.module";
import { LogsModule } from "../logs/logs.module";
import { FieldsService } from "../zfields/fields.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MstEducationProfessionMapping,
      MstSchool,
      MstMajor,
      MstProfession,
      User,
    ]),
    MstSchoolsModule,
    MstMajorsModule,
    MstProfessionsModule,
    ConfigsModule,
    LogsModule,
  ],
  controllers: [MstEducationProfessionMappingsController],
  providers: [
    MstEducationProfessionMappingsService,
    MstEducationProfessionMappingDao,
    FieldsService,
  ],
  exports: [MstEducationProfessionMappingsService, MstEducationProfessionMappingDao],
})
export class MstEducationProfessionMappingsModule {}

