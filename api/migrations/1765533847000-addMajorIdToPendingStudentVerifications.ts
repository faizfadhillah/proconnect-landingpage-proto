import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMajorIdToPendingStudentVerifications1765533847000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add major_id column
    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications" 
      ADD COLUMN IF NOT EXISTS "major_id" uuid NULL;
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications"
      ADD CONSTRAINT "FK_pending_student_verifications_mst_major" 
      FOREIGN KEY ("major_id") 
      REFERENCES "mst_majors"("id") 
      ON DELETE RESTRICT;
    `);

    // Create new unique index with major_id before dropping the old one
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_pending_student_verifications_student_school_major"
      ON "pending_student_verifications"("student_id", "school_id", "major_id");
    `);

    // Drop old unique index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_pending_student_verifications_student_school";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new unique index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_pending_student_verifications_student_school_major";
    `);

    // Recreate old unique index
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_pending_student_verifications_student_school"
      ON "pending_student_verifications"("student_id", "school_id");
    `);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications"
      DROP CONSTRAINT IF EXISTS "FK_pending_student_verifications_mst_major";
    `);

    // Drop major_id column
    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications"
      DROP COLUMN IF EXISTS "major_id";
    `);
  }
}

