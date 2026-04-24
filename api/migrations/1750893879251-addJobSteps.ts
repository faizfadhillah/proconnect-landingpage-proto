import { MigrationInterface, QueryRunner } from "typeorm";

export class AddJobSteps1750893879251 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "job_steps" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "job_id" uuid,
        "type" varchar(64),
        "step_name" varchar(100),
        "step_order" int4,
        "status" varchar(64),
        "description" text,
        "notes" text,
        "attributes" jsonb,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "questionnaires" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "job_step_id" uuid,
        "no" int4,
        "type" varchar(64),
        "question" text,
        "options" jsonb,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int4 DEFAULT 0,
        "deleted_at" timestamp,
        "is_required" boolean DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS "applicant_job_steps" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "applicant_id" uuid,
        "user_id" uuid,
        "job_step_id" uuid,
        "job_id" uuid,
        "status" varchar(64),
        "type" varchar(64),
        "step_name" varchar(100),
        "step_order" int4,
        "description" text,
        "notes" text,
        "attributes" jsonb,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );


      CREATE TABLE IF NOT EXISTS "questionnaire_answers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "questionnaire_id" uuid,
        "job_step_id" uuid,        
        "job_id" uuid,
        "applicant_job_step_id" uuid,
        "applicant_id" uuid,
        "no" int4,
        "type" varchar(64),
        "question" text,
        "options" jsonb,
        "is_required" boolean DEFAULT false,
        "value" jsonb,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "deleted_at" timestamp,        
        "version" int4 DEFAULT 0
      );
      
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "job_steps";
      DROP TABLE IF EXISTS "questionnaires";
      DROP TABLE IF EXISTS "applicant_job_steps";
      DROP TABLE IF EXISTS "questionnaire_answers";
        `);
  }
}
