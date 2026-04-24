import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Makes diploma_level nullable in mst_education_license_mappings and
 * mst_education_profession_mappings, and replaces the single unique index
 * with two partial unique indexes:
 * - Langkah 1: unique when diploma_level IS NOT NULL (5 columns)
 * - Langkah 2: unique on (school_id, major_id, degree, license_id/profession_id)
 *   when diploma_level IS NULL (one wildcard per combination)
 */
export class MakeDiplomaLevelNullableInEducationMappings1772126225000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- mst_education_license_mappings ---
    await queryRunner.query(`
      ALTER TABLE "mst_education_license_mappings"
      ALTER COLUMN "diploma_level" DROP NOT NULL
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_mapping_combination"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_edu_license_mapping_not_null"
      ON "mst_education_license_mappings"(
        "school_id", "major_id", "degree", "diploma_level", "license_id"
      )
      WHERE "deleted_at" IS NULL AND "diploma_level" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_edu_license_diploma_null"
      ON "mst_education_license_mappings"(
        "school_id", "major_id", "degree", "license_id"
      )
      WHERE "deleted_at" IS NULL AND "diploma_level" IS NULL
    `);

    // --- mst_education_profession_mappings ---
    await queryRunner.query(`
      ALTER TABLE "mst_education_profession_mappings"
      ALTER COLUMN "diploma_level" DROP NOT NULL
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_education_profession_mapping_combination"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_edu_profession_mapping_not_null"
      ON "mst_education_profession_mappings"(
        "school_id", "major_id", "degree", "diploma_level", "profession_id"
      )
      WHERE "deleted_at" IS NULL AND "diploma_level" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_edu_profession_diploma_null"
      ON "mst_education_profession_mappings"(
        "school_id", "major_id", "degree", "profession_id"
      )
      WHERE "deleted_at" IS NULL AND "diploma_level" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // --- mst_education_profession_mappings (reverse order) ---
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_edu_profession_diploma_null"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_edu_profession_mapping_not_null"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_education_profession_mapping_combination"
      ON "mst_education_profession_mappings"(
        "school_id", "major_id", "degree", "diploma_level", "profession_id"
      )
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_profession_mappings"
      ALTER COLUMN "diploma_level" SET NOT NULL
    `);

    // --- mst_education_license_mappings ---
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_edu_license_diploma_null"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_edu_license_mapping_not_null"
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_mapping_combination"
      ON "mst_education_license_mappings"(
        "school_id", "major_id", "degree", "diploma_level", "license_id"
      )
      WHERE "deleted_at" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "mst_education_license_mappings"
      ALTER COLUMN "diploma_level" SET NOT NULL
    `);
  }
}
