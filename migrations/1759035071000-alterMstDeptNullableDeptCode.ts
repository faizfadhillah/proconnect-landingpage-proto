import { MigrationInterface, QueryRunner } from "typeorm";

export class AlterMstDeptNullableDeptCode1759035071000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "mst_departments" ALTER COLUMN "dept_code" DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "mst_departments" ALTER COLUMN "dept_code" SET NOT NULL;
    `);
  }
}