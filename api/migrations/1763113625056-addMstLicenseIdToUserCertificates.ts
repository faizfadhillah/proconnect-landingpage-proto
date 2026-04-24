import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMstLicenseIdToUserCertificates1763113625056 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_certificates" 
      ADD COLUMN IF NOT EXISTS "mst_license_id" uuid NULL;

      CREATE INDEX IF NOT EXISTS "IDX_user_certificates_mst_license_id" 
      ON "user_certificates" ("mst_license_id");

      ALTER TABLE "user_certificates"
      ADD CONSTRAINT "FK_user_certificates_mst_license" 
      FOREIGN KEY ("mst_license_id") 
      REFERENCES "mst_licenses"("id") 
      ON DELETE RESTRICT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_certificates"
      DROP CONSTRAINT IF EXISTS "FK_user_certificates_mst_license";

      DROP INDEX IF EXISTS "IDX_user_certificates_mst_license_id";

      ALTER TABLE "user_certificates"
      DROP COLUMN IF EXISTS "mst_license_id";
    `);
  }
}

