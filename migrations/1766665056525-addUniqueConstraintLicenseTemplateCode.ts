import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintLicenseTemplateCode1766665056525 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add unique constraint on license_template_code
    // PostgreSQL allows multiple NULL values in unique constraints by default
    // So this will allow: NULL, NULL, 'abc123', 'abc124'
    // But will prevent duplicate non-NULL values like: 'abc124', 'abc124'
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_mst_licenses_license_template_code" 
      ON "mst_licenses" ("license_template_code") 
      WHERE "license_template_code" IS NOT NULL AND "deleted_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_mst_licenses_license_template_code";
    `);
  }
}

