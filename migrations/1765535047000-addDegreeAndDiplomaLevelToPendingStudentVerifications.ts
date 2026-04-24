import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDegreeAndDiplomaLevelToPendingStudentVerifications1765535047000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add degree column (NOT NULL with temporary default for existing rows)
    // Note: This is a new field, so existing rows should not exist, but we add default for safety
    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications" 
      ADD COLUMN IF NOT EXISTS "degree" varchar(32) NOT NULL DEFAULT 'S1';
    `);

    // Remove default after adding column (since degree is required from DTO)
    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications"
      ALTER COLUMN "degree" DROP DEFAULT;
    `);

    // Add diploma_level column (nullable)
    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications" 
      ADD COLUMN IF NOT EXISTS "diploma_level" varchar(50) NULL;
    `);

    // Drop old unique index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_pending_student_verifications_student_school_major";
    `);

    // Create new unique index with degree and diploma_level
    // PostgreSQL treats NULL as distinct, so multiple NULL values in diploma_level won't conflict
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_pending_student_verifications_student_school_major_degree_diploma"
      ON "pending_student_verifications"("student_id", "school_id", "major_id", "degree", "diploma_level")
      WHERE "deleted_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new unique index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_pending_student_verifications_student_school_major_degree_diploma";
    `);

    // Recreate old unique index
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_pending_student_verifications_student_school_major"
      ON "pending_student_verifications"("student_id", "school_id", "major_id")
      WHERE "deleted_at" IS NULL;
    `);

    // Drop diploma_level column
    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications"
      DROP COLUMN IF EXISTS "diploma_level";
    `);

    // Drop degree column
    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications"
      DROP COLUMN IF EXISTS "degree";
    `);
  }
}

