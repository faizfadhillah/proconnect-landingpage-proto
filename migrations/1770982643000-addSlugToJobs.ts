import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSlugToJobs1770982643000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "jobs" 
      ADD COLUMN IF NOT EXISTS "slug" varchar(512) NULL;
      
      CREATE INDEX IF NOT EXISTS "IDX_jobs_slug" ON "jobs" ("slug");
      
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_jobs_slug_unique" ON "jobs" ("slug") WHERE "slug" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_jobs_slug_unique";
      DROP INDEX IF EXISTS "IDX_jobs_slug";
      
      ALTER TABLE "jobs" DROP COLUMN IF EXISTS "slug";
    `);
  }
}
