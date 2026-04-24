import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRbacFields1758297391000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "rbac" ADD COLUMN IF NOT EXISTS "description" varchar(255);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "rbac" DROP COLUMN IF EXISTS "description";
    `);
  }
}