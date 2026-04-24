import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMstMajors1763112032000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mst_majors" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "major_name" varchar(255) NOT NULL UNIQUE,
        "created_at" timestamp DEFAULT now(),
        "created_by" uuid,
        "updated_at" timestamp DEFAULT now(),
        "updated_by" uuid,
        "version" int DEFAULT 0,
        "deleted_at" timestamp
      );

      CREATE INDEX IF NOT EXISTS "IDX_mst_majors_major_name" ON "mst_majors" ("major_name");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_mst_majors_major_name";

      DROP TABLE IF EXISTS "mst_majors";
    `);
  }
}