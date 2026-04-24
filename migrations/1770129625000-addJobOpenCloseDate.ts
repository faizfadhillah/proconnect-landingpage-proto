import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobOpenCloseDate1770129625000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs"
        ADD COLUMN IF NOT EXISTS "open_date" timestamp NULL,
        ADD COLUMN IF NOT EXISTS "close_date" timestamp NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs"
        DROP COLUMN IF EXISTS "close_date",
        DROP COLUMN IF EXISTS "open_date";
    `);
  }
}
