import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as path from "path";
import { MstRegion } from "src/mst_regions/entities/mst_region.entity";
import { RegionService } from "console/region.service";
import { ProfessionService } from "./profession.service";
import { MstProfession } from "src/mst_professions/entities/mst_profession.entity";
import { Job } from "src/jobs/entities/job.entity";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import { MstIndustry } from "src/mst_industries/entities/mst_industry.entity";
import { MstCountry } from "src/mst_country/entities/mst_country.entity";
import { MstSalaryCountry } from "src/mst_salary_country/entities/mst_salary_country.entity";
import { Applicant } from "src/applicants/entities/applicant.entity";
import { User } from "src/users/entities/user.entity";
import { JobSlugSeedService } from "./job-slug-seed.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get<string>("DATABASE_HOST"),
        port: parseInt(
          configService.get<string>("DATABASE_PORT") || "5432",
          10,
        ),
        username: configService.get<string>("DATABASE_USERNAME"),
        password: configService.get<string>("DATABASE_PASSWORD"),
        database: configService.get<string>("DATABASE_NAME"),
        // Use glob pattern for ts-node - load all entities from source
        entities: [
          path.join(__dirname, "../src/**/*.entity{.ts,.js}"),
        ],
        migrations: ["dist/migrations/*{.ts,.js}"],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([
      MstRegion,
      MstProfession,
      Job,
      MstCompany,
      MstIndustry,
      MstCountry,
      MstSalaryCountry,
      Applicant,
    ]),
  ],
  providers: [RegionService, ProfessionService, JobSlugSeedService],
  exports: [RegionService, ProfessionService, JobSlugSeedService],
})
export class ConsoleModule {}
