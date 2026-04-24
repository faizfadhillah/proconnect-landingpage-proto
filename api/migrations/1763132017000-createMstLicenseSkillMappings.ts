import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMstLicenseSkillMappings1763132017000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mst_license_skill_mappings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "license_id" uuid NOT NULL,
        "skill_id" uuid NOT NULL,
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
      ALTER TABLE "mst_license_skill_mappings"
      ADD CONSTRAINT "FK_license_skill_license"
      FOREIGN KEY ("license_id") REFERENCES "mst_licenses"("id")
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_license_skill_mappings"
      ADD CONSTRAINT "FK_license_skill_skill"
      FOREIGN KEY ("skill_id") REFERENCES "mst_skills"("id")
      ON DELETE RESTRICT
    `);

    // Create unique constraint (prevent exact duplicates, excluding soft-deleted records)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_license_skill_combination"
      ON "mst_license_skill_mappings"("license_id", "skill_id")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_license_skill_combination"
    `);

    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "mst_license_skill_mappings"
      DROP CONSTRAINT IF EXISTS "FK_license_skill_skill"
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_license_skill_mappings"
      DROP CONSTRAINT IF EXISTS "FK_license_skill_license"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "mst_license_skill_mappings"
    `);
  }
}

