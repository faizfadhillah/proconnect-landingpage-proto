import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserFieldGuards1771950573000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_field_guards" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" varchar(20) NOT NULL,
        "identifier" varchar(512) NULL,
        "guarded_until" timestamptz NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp,
        CONSTRAINT "UQ_user_field_guards_user_id_type" UNIQUE ("user_id", "type"),
        CONSTRAINT "FK_user_field_guards_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "user_field_guards";
    `);
  }
}
