import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePendingStudentVerifications1765209534278
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pending_student_verifications" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "student_id" varchar(255) NOT NULL,
        "school_id" uuid NOT NULL,
        "full_name" varchar(255),
        "photo_url" varchar(500),
        "email" varchar(255),
        "phone_num" varchar(50),
        "major" varchar(255),
        "created_by" uuid NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" uuid NULL,
        "deleted_at" TIMESTAMP NULL,
        "version" integer NOT NULL DEFAULT 0
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications"
      ADD CONSTRAINT "FK_pending_student_verifications_school"
      FOREIGN KEY ("school_id") REFERENCES "mst_schools"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications"
      ADD CONSTRAINT "FK_pending_student_verifications_creator"
      FOREIGN KEY ("created_by") REFERENCES "users"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_pending_student_verifications_student_school"
      ON "pending_student_verifications"("student_id", "school_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_pending_student_verifications_student_school"
    `);

    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications"
      DROP CONSTRAINT IF EXISTS "FK_pending_student_verifications_creator"
    `);

    await queryRunner.query(`
      ALTER TABLE "pending_student_verifications"
      DROP CONSTRAINT IF EXISTS "FK_pending_student_verifications_school"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "pending_student_verifications"
    `);
  }
}

