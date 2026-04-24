import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApprovalStateToUserEducations1764688784836 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add approval_state column
    await queryRunner.query(`
      ALTER TABLE "user_educations" 
      ADD COLUMN IF NOT EXISTS "approval_state" VARCHAR(20) DEFAULT 'WAITING_APPROVAL';
    `);

    // Add approval_by column
    await queryRunner.query(`
      ALTER TABLE "user_educations" 
      ADD COLUMN IF NOT EXISTS "approval_by" VARCHAR(255) NULL;
    `);

    // Migrate existing data: is_verified=true → APPROVED, approval_by='system'
    await queryRunner.query(`
      UPDATE "user_educations"
      SET "approval_state" = 'APPROVED', "approval_by" = 'system'
      WHERE "is_verified" = true;
    `);

    // Migrate existing data: is_verified=false → WAITING_APPROVAL, approval_by=NULL
    await queryRunner.query(`
      UPDATE "user_educations"
      SET "approval_state" = 'WAITING_APPROVAL', "approval_by" = NULL
      WHERE "is_verified" = false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user_educations"
      DROP COLUMN IF EXISTS "approval_by";
    `);

    await queryRunner.query(`
      ALTER TABLE "user_educations"
      DROP COLUMN IF EXISTS "approval_state";
    `);
  }
}

