import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDepartments1756747574689 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mst_departments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "dept_code" varchar(10) NOT NULL,
        "dept_name" varchar(255) NOT NULL,
        "flag" varchar(50) NOT NULL DEFAULT 'PRIVATE',
        "status" varchar(50) NOT NULL DEFAULT 'PUBLISHED',
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "company_department_map" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "company_hq_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "dept_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp,
        UNIQUE("company_id", "company_hq_id", "dept_id")
      );

      CREATE INDEX IF NOT EXISTS "IDX_mst_departments_dept_code" ON "mst_departments" ("dept_code");
      CREATE INDEX IF NOT EXISTS "IDX_mst_departments_flag" ON "mst_departments" ("flag");
      CREATE INDEX IF NOT EXISTS "IDX_mst_departments_status" ON "mst_departments" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_mst_departments_status";
      DROP INDEX IF EXISTS "IDX_mst_departments_flag";
      DROP INDEX IF EXISTS "IDX_mst_departments_dept_code";

      DROP TABLE IF EXISTS "company_department_map";
      DROP TABLE IF EXISTS "mst_departments";
    `);
  }
}