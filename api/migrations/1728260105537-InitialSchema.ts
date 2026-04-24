import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1728260105537 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "logs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tags" varchar(255),
        "level" varchar(64),
        "message" text,
        "meta" jsonb,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );
      
      CREATE TABLE IF NOT EXISTS "configs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "key" varchar(255),
        "description" varchar(255),
        "value" jsonb,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      ALTER TABLE public.configs ADD UNIQUE (key);

      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "firebase_uid" varchar(255) UNIQUE,
        "email" varchar(255),
        "user_role" varchar(50),
        "company_id" uuid,
        "company_role" varchar(50),
        "full_name" varchar(255),
        "gender" varchar(10),
        "birth_year" int,
        "photo_url" varchar(3000),
        "region_id" varchar(64),
        "is_outside_indo" boolean,
        "other_country" varchar(512),
        "other_region" varchar(512),
        "postal_code" varchar(16),
        "personal_summary" text,
        "language" jsonb,
        "availability" varchar(50),
        "employment_status" varchar(50),
        "domicile_status" varchar(50),
        "preferred_work_types" varchar(100),
        "preferred_locations" jsonb,
        "salary_expectation" varchar(50),
        "classification_of_interest" varchar(50),
        "is_email_verified" boolean,
        "otp_code" varchar(255),
        "otp_expired" timestamp,
        "is_school_verified" boolean,
        "is_skill_passport_verified" boolean,
        "last_wizard_state" int DEFAULT 0,
        "wizard_state" jsonb,
        "roles" jsonb,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "encrypted_user_data" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "encrypted_date_of_birth" text,
        "encrypted_nik" text,
        "encrypted_phone" text,
        "encrypted_address" text,
        "country_code" varchar(4),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_files" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "file_name" varchar(255),
        "file_type" varchar(50),
        "file_url" varchar(255),
        "uploaded_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_right_to_works" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "salary_country_id" uuid,
        "code" varchar(50),
        "name" varchar(255),
        "description" text,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_asp_competencies" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),        
        "primary_division" varchar(255),
        "secondary_division" varchar(255),
        "job_index_number" varchar(64),
        "job_titles" varchar(255),
        "competency_type" varchar(128),
        "competency_standard" text,
        "competency_cluster_code" varchar(64),
        "skills" text,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_right_to_works" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "salary_country_id" uuid,
        "right_to_work_id" uuid,
        "file_url" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_regions" (
        "id" varchar(64) PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255),
        "type" varchar(50),
        "parent_id" varchar(64),
        "full_name" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_languages" (
        "id" varchar(16) PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255),        
        "variants" jsonb,
        "proficiency" jsonb,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_languages" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "language_id" varchar(16), 
        "language_name" varchar(255),
        "proficiency" varchar(255),
        "variants" jsonb,
        "is_prefered" boolean,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_industries" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "name" varchar(255),
          "created_at" timestamp DEFAULT now(),
          "created_by" uuid,
          "updated_at" timestamp DEFAULT now(),
          "updated_by" uuid,
          "version" int DEFAULT 0,
          "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_companies" (
          "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          "brand_name" varchar(255),
          "parent_id" uuid,
          "branch" varchar(255),
          "company_name" varchar(255),
          "phone" varchar(255),
          "email" varchar(255),
          "photo_url" varchar(255),
          "unique_url" varchar(255),
          "website" varchar(255),
          "industry_id" uuid,
          "industry" varchar(255),
          "organization_size" varchar(255),
          "organization_type" varchar(255),
          "logo_url" varchar(255),
          "tagline" text,
          "location" text,
          "legal_type" varchar(124),
          "number_of_employees" int,
          "business_license" varchar(255),
          "tax_identification_number" varchar(255),
          "tax_identification_url" varchar(255),
          "region_id" varchar(64),
          "other_region" varchar(255),
          "is_verified" boolean DEFAULT false,
          "is_premium" boolean DEFAULT false,
          "status" varchar(50),
          "created_at" timestamp DEFAULT now(),
          "created_by" uuid,
          "updated_at" timestamp DEFAULT now(),
          "updated_by" uuid,
          "version" int DEFAULT 0,
          "deleted_at" timestamp
      );


      CREATE TABLE IF NOT EXISTS "company_files" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "company_id" uuid,
        "file_name" varchar(255),
        "file_type" varchar(50),
        "file_url" varchar(255),
        "uploaded_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "applicants" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "job_id" uuid,
        "user_id" uuid,
        "attributes" jsonb,
        "region_id" varchar(64),
        "is_premium" boolean DEFAULT false,
        "status" varchar(50),
        "last_applicant_job_step_id" uuid,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "applicant_steps" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "applicant_id" uuid,
        "step_name" varchar(100),
        "step_order" int,
        "status" varchar(50),
        "notes" text,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "applicant_legal_files" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "applicant_id" uuid,
        "file_name" varchar(255),
        "file_type" varchar(50),
        "file_url" varchar(255),
        "uploaded_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "jobs" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "company_id" uuid,
        "title" varchar(255),
        "description" text,
        "salary_pay_interval" varchar(64),
        "salary_country_id" uuid,
        "min_salary" decimal,
        "max_salary" decimal,
        "region_id" varchar(64),
        "is_outside_indo" boolean,
        "other_country" varchar(512),
        "other_region" varchar(512),
        "status" varchar(64),
        "employment_status" jsonb,
        "domicile_status" jsonb,
        "interest_ids" jsonb,
        "profession_ids" jsonb,
        "right_to_work_ids" jsonb,
        "skill_ids" jsonb,
        "mastered_languages" jsonb,
        "config" jsonb,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_certificates" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "license_number" varchar(255),
        "license_name" varchar(255),
        "issuing_organization" varchar(255),
        "issue_date" date,
        "no_expiry" boolean,
        "expiry_date" date,
        "description" text,
        "file_url" varchar(255),
        "is_verified" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_skill_passports" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "number" varchar(255),        
        "file_url" varchar(255),
        "status" varchar(64),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_career_history" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "company_name" varchar(255),
        "profession_id" uuid,
        "job_title" varchar(255),
        "start_date" date,
        "end_date" date,
        "is_current" boolean,
        "job_description" text,
        "achievement_history" jsonb,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_skills" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_skills" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "skill_id" uuid,
        "is_verified" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_interests" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_interests" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "interest_id" uuid,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_salary_country" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" varchar(4),
        "country_name" varchar(100),
        "dial_code" varchar(8),
        "flag_emoji" TEXT,
        "currency_code" varchar(10),
        "currency_symbol" varchar(100),
        "is_salary_active" boolean,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_salary_country" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "salary_pay_interval" varchar(64),
        "salary_country_id" uuid,
        "min_salary" decimal,
        "max_salary" decimal,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "job_skills" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "job_id" uuid,
        "skill_id" uuid,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "rbac" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "type" varchar(16),
        "name" varchar(255),
        "parent_role" varchar(255),
        "method" varchar(16),
        "meta" jsonb,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_professions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "parent_id" uuid,
        "level" int,
        "name" varchar(255),
        "tags" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_professions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "profession_id" uuid,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_schools" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255),
        "region_id" varchar(64),
        "address" varchar(512),
        "is_verified" boolean,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_educations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "school_id" uuid,
        "education_degree" varchar(32),
        "institution_name" varchar(255),
        "major" varchar(255),
        "region_id" varchar(64),
        "is_outside_indo" boolean,
        "other_country" varchar(512),
        "other_region" varchar(512),
        "start_date" date,
        "end_date" date,
        "is_current" boolean,
        "description" text,
        "file_url" varchar(255),
        "student_id" varchar(255),
        "certificate_number" varchar(255),
        "curriculum_year" varchar(255),
        "is_verified" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "invoices" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "invoice_number" varchar(50),
        "payment_method" varchar(50),
        "amount" decimal,
        "status" varchar(50),
        "subscription_id" uuid,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "invoices_items" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "invoice_id" uuid,
        "paket_id" uuid,
        "price" decimal,
        "qty" int,
        "amount" decimal,
        "status" varchar(50),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "posts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "company_id" uuid,
        "content" text,
        "post_type" varchar(50),
        "tags" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );
      
      CREATE TABLE IF NOT EXISTS "feedbacks" (        
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "code" varchar(64),
        "user_id" uuid,
        "type" varchar(64),
        "email" varchar(255),        
        "description" text,
        "attachment_url" varchar(255),  
        "status" varchar(64),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "events" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "title" varchar(255),
        "description" text,
        "event_date" timestamp,
        "tags" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_subscription" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "description" text,
        "price" decimal NOT NULL,
        "duration" int NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        "deleted_at" timestamp,
        "created_by" uuid,        
        "updated_by" uuid,
        "version" int DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS "user_subscription" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "subscription_id" uuid NOT NULL,
        "start_date" timestamp,
        "end_date" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        "created_by" uuid,        
        "updated_by" uuid,
        "version" int DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS "event_pakets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "event_id" uuid,
        "name" varchar(255),
        "description" text,
        "price" decimal,
        "is_premium" boolean,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "mst_tags" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "type" varchar(50),
        "tag" varchar(255),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "follow_user_to_user" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "following_id" uuid,
        "status" varchar(50),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "follow_user_to_companies" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "company_id" uuid,
        "status" varchar(50),
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "groups" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(), 
        "name" varchar(255),
        "description" text,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "group_members" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "group_id" uuid,
        "user_id" uuid,
        "role" varchar(50),
        "joined_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp,
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE TABLE IF NOT EXISTS "user_otp" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid,
        "otp" varchar(64),
        "email" varchar(255),
        "expiry_date" timestamp,
        "created_at" timestamp,
        "created_by" uuid,
        "updated_at" timestamp,
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );
      
      ALTER TABLE "encrypted_user_data" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "user_files" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "user_right_to_works" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "user_right_to_works" ADD FOREIGN KEY ("right_to_work_id") REFERENCES "mst_right_to_works" ("id");     
      ALTER TABLE "mst_companies" ADD FOREIGN KEY ("region_id") REFERENCES "mst_regions" ("id");
      ALTER TABLE "company_files" ADD FOREIGN KEY ("company_id") REFERENCES "mst_companies" ("id");
      ALTER TABLE "applicants" ADD FOREIGN KEY ("job_id") REFERENCES "jobs" ("id");
      ALTER TABLE "applicants" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "applicants" ADD FOREIGN KEY ("region_id") REFERENCES "mst_regions" ("id");
      ALTER TABLE "applicant_steps" ADD FOREIGN KEY ("applicant_id") REFERENCES "applicants" ("id");
      ALTER TABLE "applicant_legal_files" ADD FOREIGN KEY ("applicant_id") REFERENCES "applicants" ("id");
      ALTER TABLE "jobs" ADD FOREIGN KEY ("region_id") REFERENCES "mst_regions" ("id");
      ALTER TABLE "user_certificates" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "user_career_history" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "user_skills" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "user_skills" ADD FOREIGN KEY ("skill_id") REFERENCES "mst_skills" ("id");
      ALTER TABLE "job_skills" ADD FOREIGN KEY ("job_id") REFERENCES "jobs" ("id");
      ALTER TABLE "job_skills" ADD FOREIGN KEY ("skill_id") REFERENCES "mst_skills" ("id");
      ALTER TABLE "mst_professions" ADD FOREIGN KEY ("parent_id") REFERENCES "mst_professions" ("id");
      ALTER TABLE "user_professions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "user_educations" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "invoices" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "invoices" ADD FOREIGN KEY ("subscription_id") REFERENCES "mst_subscription" ("id");
      ALTER TABLE "invoices_items" ADD FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id");
      ALTER TABLE "invoices_items" ADD FOREIGN KEY ("paket_id") REFERENCES "event_pakets" ("id");
      ALTER TABLE "posts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");      
      ALTER TABLE "user_subscription" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
      ALTER TABLE "user_subscription" ADD FOREIGN KEY ("subscription_id") REFERENCES "mst_subscription" ("id");
      ALTER TABLE "event_pakets" ADD FOREIGN KEY ("event_id") REFERENCES "events" ("id");     
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`
      DROP TABLE IF EXISTS "user_otp";
      DROP TABLE IF EXISTS "group_members";
      DROP TABLE IF EXISTS "groups";
      DROP TABLE IF EXISTS "follow_user_to_companies";
      DROP TABLE IF EXISTS "follow_user_to_user";
      DROP TABLE IF EXISTS "mst_tags";
      DROP TABLE IF EXISTS "event_pakets";
      DROP TABLE IF EXISTS "user_subscription";
      DROP TABLE IF EXISTS "mst_subscription";
      DROP TABLE IF EXISTS "events";
      DROP TABLE IF EXISTS "posts";
      DROP TABLE IF EXISTS "invoices_items";
      DROP TABLE IF EXISTS "invoices";
      DROP TABLE IF EXISTS "user_educations";
      DROP TABLE IF EXISTS "mst_schools";
      DROP TABLE IF EXISTS "user_professions";
      DROP TABLE IF EXISTS "mst_professions";
      DROP TABLE IF EXISTS "rbac";
      DROP TABLE IF EXISTS "job_skills";
      DROP TABLE IF EXISTS "user_skills";
      DROP TABLE IF EXISTS "mst_skills";
      DROP TABLE IF EXISTS "user_salary_country";
      DROP TABLE IF EXISTS "mst_salary_country";
      DROP TABLE IF EXISTS "user_interests";
      DROP TABLE IF EXISTS "mst_interests";
      DROP TABLE IF EXISTS "user_career_history";
      DROP TABLE IF EXISTS "user_skill_passports";
      DROP TABLE IF EXISTS "user_certificates";
      DROP TABLE IF EXISTS "jobs";
      DROP TABLE IF EXISTS "applicant_legal_files";
      DROP TABLE IF EXISTS "applicant_steps";
      DROP TABLE IF EXISTS "applicants";
      DROP TABLE IF EXISTS "company_files";
      DROP TABLE IF EXISTS "mst_companies";
      DROP TABLE IF EXISTS "mst_industries";
      DROP TABLE IF EXISTS "mst_regions";
      DROP TABLE IF EXISTS "mst_languages";
      DROP TABLE IF EXISTS "mst_asp_competencies";
      DROP TABLE IF EXISTS "user_right_to_works";
      DROP TABLE IF EXISTS "mst_right_to_works";
      DROP TABLE IF EXISTS "user_files";
      DROP TABLE IF EXISTS "encrypted_user_data";
      DROP TABLE IF EXISTS "users";
      DROP TABLE IF EXISTS "configs";
      DROP TABLE IF EXISTS "logs";
    `);
  }
}
