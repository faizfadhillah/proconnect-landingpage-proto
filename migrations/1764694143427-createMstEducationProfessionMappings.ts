import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMstEducationProfessionMappings1764694143427 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mst_education_profession_mappings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "school_id" uuid NOT NULL,
        "major_id" uuid NOT NULL,
        "degree" varchar(32) NOT NULL,
        "diploma_level" varchar(50) NOT NULL,
        "profession_id" uuid NOT NULL,
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
      ALTER TABLE "mst_education_profession_mappings"
      ADD CONSTRAINT "FK_education_profession_mapping_school"
      FOREIGN KEY ("school_id") REFERENCES "mst_schools"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_profession_mappings"
      ADD CONSTRAINT "FK_education_profession_mapping_major"
      FOREIGN KEY ("major_id") REFERENCES "mst_majors"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_profession_mappings"
      ADD CONSTRAINT "FK_education_profession_mapping_profession"
      FOREIGN KEY ("profession_id") REFERENCES "mst_professions"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_profession_mappings"
      ADD CONSTRAINT "FK_education_profession_mapping_creator"
      FOREIGN KEY ("created_by") REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

    // Create unique constraint (prevent exact duplicates, excluding soft-deleted records)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_education_profession_mapping_combination"
      ON "mst_education_profession_mappings"(
        "school_id", "major_id", "degree", "diploma_level", "profession_id"
      )
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_education_profession_mapping_combination"
    `);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "mst_education_profession_mappings"
      DROP CONSTRAINT IF EXISTS "FK_education_profession_mapping_creator"
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_profession_mappings"
      DROP CONSTRAINT IF EXISTS "FK_education_profession_mapping_profession"
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_profession_mappings"
      DROP CONSTRAINT IF EXISTS "FK_education_profession_mapping_major"
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_profession_mappings"
      DROP CONSTRAINT IF EXISTS "FK_education_profession_mapping_school"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "mst_education_profession_mappings"
    `);
  }
}

