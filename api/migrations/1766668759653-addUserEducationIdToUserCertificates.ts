import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserEducationIdToUserCertificates1766668759653 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add user_education_id column
    await queryRunner.query(`
      ALTER TABLE "user_certificates" 
      ADD COLUMN IF NOT EXISTS "user_education_id" uuid NULL;
    `);

    // Add foreign key constraint with RESTRICT to prevent accidental deletion
    // Cascade delete is handled in service layer (UserEducationsService.remove())
    await queryRunner.query(`
      ALTER TABLE "user_certificates"
      ADD CONSTRAINT "FK_user_certificates_user_education" 
      FOREIGN KEY ("user_education_id") 
      REFERENCES "user_educations"("id") 
      ON DELETE RESTRICT;
    `);

    // Add index for efficient lookups
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_certificates_user_education_id" 
      ON "user_certificates"("user_education_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_certificates_user_education_id";
    `);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "user_certificates"
      DROP CONSTRAINT IF EXISTS "FK_user_certificates_user_education";
    `);

    // Drop column
    await queryRunner.query(`
      ALTER TABLE "user_certificates" 
      DROP COLUMN IF EXISTS "user_education_id";
    `);
  }
}

