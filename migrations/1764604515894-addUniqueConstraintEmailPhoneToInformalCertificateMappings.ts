import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintEmailPhoneToInformalCertificateMappings1764604515894 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create unique constraint on (email, phone) combination
    // Using COALESCE to handle NULL values properly
    // This prevents duplicate combinations like (null, 621234553) and (null, 621234553)
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_informal_mapping_email_phone" 
      ON "mst_informal_certificate_mappings"(
        COALESCE("email", ''), 
        COALESCE("phone", '')
      )
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique constraint
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_informal_mapping_email_phone"
    `);
  }
}

