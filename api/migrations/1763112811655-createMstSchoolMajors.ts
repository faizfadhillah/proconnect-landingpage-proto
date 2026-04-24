import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMstSchoolMajors1763112811655 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mst_school_majors" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "school_id" uuid NOT NULL,
        "major_id" uuid NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp,
        CONSTRAINT "FK_mst_school_majors_school" FOREIGN KEY ("school_id") 
          REFERENCES "mst_schools"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_mst_school_majors_major" FOREIGN KEY ("major_id") 
          REFERENCES "mst_majors"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_mst_school_majors_school_major" UNIQUE ("school_id", "major_id")
      );

      CREATE INDEX IF NOT EXISTS "IDX_mst_school_majors_school_id" ON "mst_school_majors" ("school_id");
      CREATE INDEX IF NOT EXISTS "IDX_mst_school_majors_major_id" ON "mst_school_majors" ("major_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_mst_school_majors_major_id";
      DROP INDEX IF EXISTS "IDX_mst_school_majors_school_id";

      DROP TABLE IF EXISTS "mst_school_majors";
    `);
  }
}

