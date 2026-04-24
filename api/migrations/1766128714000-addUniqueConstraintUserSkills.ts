import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintUserSkills1766128714000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create unique constraint on (user_id, skill_id) combination
    // Only applies to non-deleted records (WHERE deleted_at IS NULL)
    // This prevents duplicate user_skills entries for the same user + skill combination
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_user_skills_user_skill" 
      ON "user_skills"("user_id", "skill_id")
      WHERE "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop unique constraint
    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_user_skills_user_skill"
    `);
  }
}

