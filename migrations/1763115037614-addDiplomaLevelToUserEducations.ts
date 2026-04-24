import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDiplomaLevelToUserEducations1763115037614 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_educations" 
      ADD COLUMN IF NOT EXISTS "diploma_level" varchar(50) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_educations"
      DROP COLUMN IF EXISTS "diploma_level";
    `);
  }
}

