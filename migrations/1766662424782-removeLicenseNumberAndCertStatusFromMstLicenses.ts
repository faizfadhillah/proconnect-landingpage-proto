import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveLicenseNumberAndCertStatusFromMstLicenses1766662424782 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove license_number column from mst_licenses
    await queryRunner.query(`
      ALTER TABLE "mst_licenses" 
      DROP COLUMN IF EXISTS "license_number";
    `);

    // Remove certification_status column from mst_licenses
    await queryRunner.query(`
      ALTER TABLE "mst_licenses" 
      DROP COLUMN IF EXISTS "certification_status";
    `);

    // Add license_template_code column to mst_licenses (nullable, as identifier/metadata)
    await queryRunner.query(`
      ALTER TABLE "mst_licenses" 
      ADD COLUMN IF NOT EXISTS "license_template_code" varchar(255) NULL;
    `);

    // Make user_certificates.license_number nullable (if not already nullable)
    await queryRunner.query(`
      ALTER TABLE "user_certificates" 
      ALTER COLUMN "license_number" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore user_certificates.license_number NOT NULL constraint
    await queryRunner.query(`
      ALTER TABLE "user_certificates" 
      ALTER COLUMN "license_number" SET NOT NULL;
    `);

    // Remove license_template_code column from mst_licenses
    await queryRunner.query(`
      ALTER TABLE "mst_licenses" 
      DROP COLUMN IF EXISTS "license_template_code";
    `);

    // Restore certification_status column to mst_licenses
    await queryRunner.query(`
      ALTER TABLE "mst_licenses" 
      ADD COLUMN IF NOT EXISTS "certification_status" varchar(50) NOT NULL DEFAULT 'NOT_VERIFIED';
    `);

    // Restore license_number column to mst_licenses
    await queryRunner.query(`
      ALTER TABLE "mst_licenses" 
      ADD COLUMN IF NOT EXISTS "license_number" varchar(255) NOT NULL;
    `);
  }
}

