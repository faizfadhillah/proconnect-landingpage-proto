import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMstEducationLicenseMappings1763129342708 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mst_education_license_mappings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "school_id" uuid NOT NULL,
        "major_id" uuid NOT NULL,
        "degree" varchar(32) NOT NULL,
        "diploma_level" varchar(50) NOT NULL,
        "license_id" uuid NOT NULL,
        "created_by" uuid NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" uuid NULL,
        "deleted_at" TIMESTAMP NULL,
        "version" integer NOT NULL DEFAULT 0
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "mst_education_license_mappings"
      ADD CONSTRAINT "FK_mapping_school"
      FOREIGN KEY ("school_id") REFERENCES "mst_schools"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_license_mappings"
      ADD CONSTRAINT "FK_mapping_major"
      FOREIGN KEY ("major_id") REFERENCES "mst_majors"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_license_mappings"
      ADD CONSTRAINT "FK_mapping_license"
      FOREIGN KEY ("license_id") REFERENCES "mst_licenses"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_license_mappings"
      ADD CONSTRAINT "FK_mapping_creator"
      FOREIGN KEY ("created_by") REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

    // Create unique constraint (prevent exact duplicates, excluding soft-deleted records)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_mapping_combination"
      ON "mst_education_license_mappings"(
        "school_id", "major_id", "degree", "diploma_level", "license_id"
      )
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_mapping_combination"
    `);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "mst_education_license_mappings"
      DROP CONSTRAINT IF EXISTS "FK_mapping_creator"
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_license_mappings"
      DROP CONSTRAINT IF EXISTS "FK_mapping_license"
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_license_mappings"
      DROP CONSTRAINT IF EXISTS "FK_mapping_major"
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_license_mappings"
      DROP CONSTRAINT IF EXISTS "FK_mapping_school"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "mst_education_license_mappings"
    `);
  }
}

