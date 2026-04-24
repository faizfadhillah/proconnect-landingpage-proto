import { MigrationInterface, QueryRunner } from "typeorm";

export class BulkUploadTables1756747574690 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Create email_logs table
      CREATE TABLE IF NOT EXISTS "email_logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NULL,
        "type" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "email_sent_status" varchar(50) NOT NULL DEFAULT 'PENDING',
        "email_send_at" timestamp NULL,
        "email_failed_reason" text NULL,
        "attempt_count" int NULL,
        "max_retries" int NULL,
        "next_retry_at" timestamp NULL,
        "job_id" varchar(255) NULL,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      -- Create upload_batches table
      CREATE TABLE IF NOT EXISTS "upload_batches" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "uploaded_by" uuid NULL,
        "total_rows" int NOT NULL,
        "valid_rows" int NOT NULL DEFAULT 0,
        "invalid_rows" int NOT NULL DEFAULT 0,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      -- Create upload_batch_rows table
      CREATE TABLE IF NOT EXISTS "upload_batch_rows" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "batch_id" uuid NOT NULL,
        "type" varchar(50) NOT NULL,
        "additional_data" jsonb NULL,
        "row_status" varchar(50) NOT NULL DEFAULT 'PENDING',
        "error_messages" text[] NULL,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      -- Add foreign key constraints
      ALTER TABLE "email_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "upload_batch_rows" ADD FOREIGN KEY ("batch_id") REFERENCES "upload_batches" ("id");

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS "IDX_email_logs_type_status_retry" ON "email_logs" ("type", "email_sent_status", "next_retry_at");
      CREATE INDEX IF NOT EXISTS "IDX_email_logs_user_id" ON "email_logs" ("user_id");
      CREATE INDEX IF NOT EXISTS "IDX_email_logs_job_id" ON "email_logs" ("job_id");
      CREATE INDEX IF NOT EXISTS "IDX_upload_batch_rows_batch_status" ON "upload_batch_rows" ("batch_id", "row_status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      -- Drop indexes
      DROP INDEX IF EXISTS "IDX_upload_batch_rows_batch_status";
      DROP INDEX IF EXISTS "IDX_email_logs_job_id";
      DROP INDEX IF EXISTS "IDX_email_logs_user_id";
      DROP INDEX IF EXISTS "IDX_email_logs_type_status_retry";

      -- Drop foreign keys
      ALTER TABLE "upload_batch_rows" DROP CONSTRAINT IF EXISTS "upload_batch_rows_batch_id_fkey";
      ALTER TABLE "email_logs" DROP CONSTRAINT IF EXISTS "email_logs_user_id_fkey";

      -- Drop tables
      DROP TABLE IF EXISTS "upload_batch_rows";
      DROP TABLE IF EXISTS "upload_batches";
      DROP TABLE IF EXISTS "email_logs";
    `);
  }
}