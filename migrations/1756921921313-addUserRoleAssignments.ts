import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRoleAssignments1756921921313 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_role_assignments" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "company_hq_id" uuid,
        "company_id" uuid,
        "dept_id" uuid,
        "company_role" varchar(50),
        "role" varchar(50) NOT NULL,
        "start_date" date,
        "end_date" date,
        "status" varchar(20) NOT NULL,
        "employment_type" varchar(50),
        "profession_id" uuid,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp,
        CONSTRAINT "UQ_user_role_assignments_combination" UNIQUE ("user_id", "company_hq_id", "company_id", "dept_id")
      );

      CREATE TABLE IF NOT EXISTS "user_role_assignment_history" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "company_hq_id" uuid,
        "company_id" uuid,
        "dept_id" uuid,
        "company_role" varchar(50),
        "role" varchar(50) NOT NULL,
        "start_date" date,
        "end_date" date,
        "status" varchar(20) NOT NULL,
        "employment_type" varchar(50),
        "profession_id" uuid,
        "role_assignment_id" uuid,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp,
        CONSTRAINT "UQ_user_role_assignment_history_combination" UNIQUE ("user_id", "company_hq_id", "company_id", "dept_id")
      );

      ALTER TABLE "user_role_assignments" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "user_role_assignments" ADD FOREIGN KEY ("company_hq_id") REFERENCES "mst_companies" ("id");
      ALTER TABLE "user_role_assignments" ADD FOREIGN KEY ("company_id") REFERENCES "mst_companies" ("id");
      ALTER TABLE "user_role_assignments" ADD FOREIGN KEY ("dept_id") REFERENCES "mst_departments" ("id");
      ALTER TABLE "user_role_assignments" ADD FOREIGN KEY ("profession_id") REFERENCES "mst_professions" ("id");

      ALTER TABLE "user_role_assignment_history" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "user_role_assignment_history" ADD FOREIGN KEY ("company_hq_id") REFERENCES "mst_companies" ("id");
      ALTER TABLE "user_role_assignment_history" ADD FOREIGN KEY ("company_id") REFERENCES "mst_companies" ("id");
      ALTER TABLE "user_role_assignment_history" ADD FOREIGN KEY ("dept_id") REFERENCES "mst_departments" ("id");
      ALTER TABLE "user_role_assignment_history" ADD FOREIGN KEY ("profession_id") REFERENCES "mst_professions" ("id");
      ALTER TABLE "user_role_assignment_history" ADD FOREIGN KEY ("role_assignment_id") REFERENCES "user_role_assignments" ("id");

      CREATE INDEX IF NOT EXISTS "IDX_user_role_assignments_user_id" ON "user_role_assignments" ("user_id");
      CREATE INDEX IF NOT EXISTS "IDX_user_role_assignments_company_id" ON "user_role_assignments" ("company_id");
      CREATE INDEX IF NOT EXISTS "IDX_user_role_assignments_dept_id" ON "user_role_assignments" ("dept_id");
      CREATE INDEX IF NOT EXISTS "IDX_user_role_assignments_status" ON "user_role_assignments" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_role_assignments_status";
      DROP INDEX IF EXISTS "IDX_user_role_assignments_dept_id";
      DROP INDEX IF EXISTS "IDX_user_role_assignments_company_id";
      DROP INDEX IF EXISTS "IDX_user_role_assignments_user_id";

      ALTER TABLE "user_role_assignment_history" DROP CONSTRAINT IF EXISTS "FK_user_role_assignment_history_profession_id";
      ALTER TABLE "user_role_assignment_history" DROP CONSTRAINT IF EXISTS "FK_user_role_assignment_history_dept_id";
      ALTER TABLE "user_role_assignment_history" DROP CONSTRAINT IF EXISTS "FK_user_role_assignment_history_company_id";
      ALTER TABLE "user_role_assignment_history" DROP CONSTRAINT IF EXISTS "FK_user_role_assignment_history_company_hq_id";
      ALTER TABLE "user_role_assignment_history" DROP CONSTRAINT IF EXISTS "FK_user_role_assignment_history_user_id";

      ALTER TABLE "user_role_assignments" DROP CONSTRAINT IF EXISTS "FK_user_role_assignments_profession_id";
      ALTER TABLE "user_role_assignments" DROP CONSTRAINT IF EXISTS "FK_user_role_assignments_dept_id";
      ALTER TABLE "user_role_assignments" DROP CONSTRAINT IF EXISTS "FK_user_role_assignments_company_id";
      ALTER TABLE "user_role_assignments" DROP CONSTRAINT IF EXISTS "FK_user_role_assignments_company_hq_id";
      ALTER TABLE "user_role_assignments" DROP CONSTRAINT IF EXISTS "FK_user_role_assignments_user_id";

      DROP TABLE IF EXISTS "user_role_assignment_history";
      DROP TABLE IF EXISTS "user_role_assignments";
    `);
  }
}