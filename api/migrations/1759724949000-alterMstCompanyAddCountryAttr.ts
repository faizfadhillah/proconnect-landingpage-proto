import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterMstCompanyAddCountryAttr1759724949000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mst_companies
      ADD COLUMN IF NOT EXISTS country_id uuid,
      ADD COLUMN IF NOT EXISTS other_country varchar(64),
      ADD COLUMN IF NOT EXISTS is_outside_indo boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS use_hq_business_profile boolean DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mst_companies
      DROP COLUMN IF EXISTS country_id,
      DROP COLUMN IF EXISTS other_country,
      DROP COLUMN IF EXISTS is_outside_indo,
      DROP COLUMN IF EXISTS use_hq_business_profile
    `);
  }
}