import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyDescription1756922019871 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "mst_companies" ADD COLUMN IF NOT EXISTS "company_description" text;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "mst_companies" DROP COLUMN IF EXISTS "company_description";
    `);
  }
}