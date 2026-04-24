import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMajorIdToUserEducations1765385288489 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_educations" 
      ADD COLUMN IF NOT EXISTS "major_id" uuid NULL;

      ALTER TABLE "user_educations"
      ADD CONSTRAINT "FK_user_educations_mst_major" 
      FOREIGN KEY ("major_id") 
      REFERENCES "mst_majors"("id") 
      ON DELETE RESTRICT;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_educations"
      DROP CONSTRAINT IF EXISTS "FK_user_educations_mst_major";

      ALTER TABLE "user_educations"
      DROP COLUMN IF EXISTS "major_id";
    `);
  }
}

