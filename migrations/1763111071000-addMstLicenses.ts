import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMstLicenses1763111071000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mst_licenses" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "license_number" varchar(255) NOT NULL,
        "license_name" varchar(255) NOT NULL,
        "issuing_organization" varchar(255) NOT NULL,
        "issue_date" date,
        "test_location" varchar(255),
        "assessor" varchar(255),
        "certificate_level" varchar(255),
        "certification_status" varchar(50) NOT NULL DEFAULT 'NOT_VERIFIED',
        "standard_name" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "mst_licenses";
    `);
  }
}
