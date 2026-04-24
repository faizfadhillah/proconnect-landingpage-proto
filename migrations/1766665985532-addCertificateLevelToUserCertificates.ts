import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCertificateLevelToUserCertificates1766666000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_certificates" 
      ADD COLUMN IF NOT EXISTS "certificate_level" varchar(255) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_certificates" 
      DROP COLUMN IF EXISTS "certificate_level";
    `);
  }
}

