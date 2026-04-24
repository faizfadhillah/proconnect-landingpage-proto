import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneLast4DigitsToUsers1764602445042 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "phone_last_4_digits" VARCHAR(4) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "users" DROP COLUMN IF EXISTS "phone_last_4_digits";
    `);
  }
}

