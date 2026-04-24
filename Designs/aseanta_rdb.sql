CREATE TABLE "config" (
  "id" uuid PRIMARY KEY,
  "key" varchar(255) PRIMARY KEY,
  "description" varchar(255),
  "value" jsonb,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "firebase_uid" varchar(255) UNIQUE,
  "email" varchar(255),
  "user_role" enum,
  "company_id" uuid,
  "company_role" enum,
  "full_name" varchar(255),
  "gender" varchar(10),
  "region_id" uuid,
  "personal_summary" text,
  "language" jsonb,
  "availability" varchar(50),
  "preferred_work_types" varchar(100),
  "preferred_locations" jsonb,
  "salary_expectation" varchar(50),
  "classification_of_interest" varchar(50),
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "encrypted_user_data" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "encrypted_date_of_birth" text,
  "encrypted_nik" text,
  "encrypted_phone" text,
  "encrypted_address" text,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "user_files" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "file_name" varchar(255),
  "file_type" enum,
  "file_url" varchar(255),
  "uploaded_at" timestamp,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "mst_right_to_works" (
  "id" uuid PRIMARY KEY,
  "code" varchar(50),
  "name" varchar(255),
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "user_right_to_works" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "right_to_work_id" uuid,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "mst_regions" (
  "id" uuid PRIMARY KEY,
  "name" varchar(255),
  "type" varchar(50),
  "parent_id" uuid,
  "code" varchar(20),
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "mst_companies" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "name" varchar(255),
  "profile_data" text,
  "region_id" uuid,
  "is_verified" boolean DEFAULT false,
  "is_premium" boolean DEFAULT false,
  "status" enum,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "company_files" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid,
  "file_name" varchar(255),
  "file_type" enum,
  "file_url" varchar(255),
  "uploaded_at" timestamp,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "applicants" (
  "id" uuid PRIMARY KEY,
  "job_id" uuid,
  "user_id" uuid,
  "attributes" jsonb,
  "region_id" uuid,
  "is_premium" boolean DEFAULT false,
  "status" enum,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "applicant_steps" (
  "id" uuid PRIMARY KEY,
  "applicant_id" uuid,
  "step_name" varchar(100),
  "step_order" int,
  "status" enum,
  "notes" text,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "applicant_legal_files" (
  "id" uuid PRIMARY KEY,
  "applicant_id" uuid,
  "file_name" varchar(255),
  "file_type" enum,
  "file_url" varchar(255),
  "uploaded_at" timestamp,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "jobs" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid,
  "title" varchar(255),
  "description" text,
  "region_id" uuid,
  "config" jsonb,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "user_certificates" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "license_name" varchar(255),
  "issuing_organization" varchar(255),
  "issue_date" date,
  "no_expiry" boolean,
  "expiry_date" date,
  "description" text,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "user_career_history" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "company_name" varchar(255),
  "job_title" varchar(255),
  "start_date" date,
  "end_date" date,
  "is_current" boolean,
  "job_description" text,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "mst_skills" (
  "id" uuid PRIMARY KEY,
  "name" varchar(255),
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "user_skills" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "skill_id" uuid,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "job_skills" (
  "id" uuid PRIMARY KEY,
  "job_id" uuid,
  "skill_id" uuid,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "rbac" (
  "id" uuid PRIMARY KEY,
  "role_name" varchar(255),
  "permissions" text,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "mst_professions" (
  "id" uuid PRIMARY KEY,
  "parent_id" uuid,
  "level" int,
  "name" varchar(255),
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "user_professions" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "profession_id" uuid,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "mst_educations" (
  "id" uuid PRIMARY KEY,
  "level" varchar(10),
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "user_educations" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "education_id" uuid,
  "institution_name" varchar(255),
  "major" varchar(255),
  "start_date" date,
  "end_date" date,
  "is_current" boolean,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "invoices" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "invoice_number" varchar(50),
  "payment_method" varchar(50),
  "amount" decimal,
  "status" enum,
  "subscription_id" uuid,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "invoices_items" (
  "id" uuid PRIMARY KEY,
  "invoice_id" uuid,
  "paket_id" uuid,
  "price" decimal,
  "qty" int,
  "amount" decimal,
  "status" enum,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "posts" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "company_id" uuid,
  "content" text,
  "post_type" varchar(50),
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "events" (
  "id" uuid PRIMARY KEY,
  "title" varchar(255),
  "description" text,
  "event_date" timestamp,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "mst_subscription" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "name" varchar(255) NOT NULL,
  "description" text,
  "price" decimal NOT NULL,
  "duration" int NOT NULL,
  "created_at" timestamp DEFAULT (current_timestamp),
  "updated_at" timestamp DEFAULT (current_timestamp),
  "deleted_at" timestamp,
  "created_by" uuid,
  "updated_by" uuid
);

CREATE TABLE "user_subscription" (
  "id" uuid PRIMARY KEY DEFAULT (uuid_generate_v4()),
  "user_id" uuid NOT NULL,
  "subscription_id" uuid NOT NULL,
  "start_date" timestamp DEFAULT (current_timestamp),
  "end_date" timestamp,
  "created_at" timestamp DEFAULT (current_timestamp),
  "updated_at" timestamp DEFAULT (current_timestamp)
);

CREATE TABLE "event_pakets" (
  "id" uuid PRIMARY KEY,
  "event_id" uuid,
  "name" varchar(255),
  "description" text,
  "price" decimal,
  "is_premium" boolean,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "event_tags" (
  "id" uuid PRIMARY KEY,
  "event_id" uuid,
  "tag" varchar(255),
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "follow_user_to_user" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "following_id" uuid,
  "status" enum,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "follow_user_to_companies" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid,
  "company_id" uuid,
  "status" enum,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "groups" (
  "id" uuid PRIMARY KEY,
  "name" varchar(255),
  "description" text,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

CREATE TABLE "group_members" (
  "id" uuid PRIMARY KEY,
  "group_id" uuid,
  "user_id" uuid,
  "role" varchar(50),
  "joined_at" timestamp,
  "created_at" timestamp,
  "created_by" uuid,
  "updated_at" timestamp,
  "updated_by" uuid,
  "deleted_at" timestamp
);

ALTER TABLE "users" ADD FOREIGN KEY ("company_id") REFERENCES "mst_companies" ("id");

ALTER TABLE "encrypted_user_data" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_files" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_right_to_works" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_right_to_works" ADD FOREIGN KEY ("right_to_work_id") REFERENCES "mst_right_to_works" ("id");

ALTER TABLE "mst_companies" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "mst_companies" ADD FOREIGN KEY ("region_id") REFERENCES "mst_regions" ("id");

ALTER TABLE "company_files" ADD FOREIGN KEY ("company_id") REFERENCES "mst_companies" ("id");

ALTER TABLE "applicants" ADD FOREIGN KEY ("job_id") REFERENCES "jobs" ("id");

ALTER TABLE "applicants" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "applicants" ADD FOREIGN KEY ("region_id") REFERENCES "mst_regions" ("id");

ALTER TABLE "applicant_steps" ADD FOREIGN KEY ("applicant_id") REFERENCES "applicants" ("id");

ALTER TABLE "applicant_legal_files" ADD FOREIGN KEY ("applicant_id") REFERENCES "applicants" ("id");

ALTER TABLE "jobs" ADD FOREIGN KEY ("company_id") REFERENCES "mst_companies" ("id");

ALTER TABLE "jobs" ADD FOREIGN KEY ("region_id") REFERENCES "mst_regions" ("id");

ALTER TABLE "user_certificates" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_career_history" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_skills" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_skills" ADD FOREIGN KEY ("skill_id") REFERENCES "mst_skills" ("id");

ALTER TABLE "job_skills" ADD FOREIGN KEY ("job_id") REFERENCES "jobs" ("id");

ALTER TABLE "job_skills" ADD FOREIGN KEY ("skill_id") REFERENCES "mst_skills" ("id");

ALTER TABLE "mst_professions" ADD FOREIGN KEY ("parent_id") REFERENCES "mst_professions" ("id");

ALTER TABLE "user_professions" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_professions" ADD FOREIGN KEY ("profession_id") REFERENCES "mst_professions" ("id");

ALTER TABLE "user_educations" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_educations" ADD FOREIGN KEY ("education_id") REFERENCES "mst_educations" ("id");

ALTER TABLE "invoices" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "invoices" ADD FOREIGN KEY ("subscription_id") REFERENCES "mst_subscription" ("id");

ALTER TABLE "invoices_items" ADD FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id");

ALTER TABLE "invoices_items" ADD FOREIGN KEY ("paket_id") REFERENCES "event_pakets" ("id");

ALTER TABLE "posts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "posts" ADD FOREIGN KEY ("company_id") REFERENCES "mst_companies" ("id");

ALTER TABLE "user_subscription" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "user_subscription" ADD FOREIGN KEY ("subscription_id") REFERENCES "mst_subscription" ("id");

ALTER TABLE "event_pakets" ADD FOREIGN KEY ("event_id") REFERENCES "events" ("id");

ALTER TABLE "event_tags" ADD FOREIGN KEY ("event_id") REFERENCES "events" ("id");

ALTER TABLE "follow_user_to_user" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "follow_user_to_companies" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");

ALTER TABLE "follow_user_to_companies" ADD FOREIGN KEY ("company_id") REFERENCES "mst_companies" ("id");

ALTER TABLE "group_members" ADD FOREIGN KEY ("group_id") REFERENCES "groups" ("id");

ALTER TABLE "group_members" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id");
