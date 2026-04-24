import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailLogWebhookFields1761066970000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "email_logs"
        ADD COLUMN IF NOT EXISTS "opened_at" timestamp NULL,
        ADD COLUMN IF NOT EXISTS "clicked_at" timestamp NULL,
        ADD COLUMN IF NOT EXISTS "bounced_at" timestamp NULL,
        ADD COLUMN IF NOT EXISTS "webhook_events" jsonb NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "email_logs"
        DROP COLUMN IF EXISTS "webhook_events",
        DROP COLUMN IF EXISTS "bounced_at",
        DROP COLUMN IF EXISTS "clicked_at",
        DROP COLUMN IF EXISTS "opened_at";
    `);
  }
}