import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMstInformalCertificateMappings1763132018000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "mst_informal_certificate_mappings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar(255) NULL,
        "phone" varchar(50) NULL,
        "license_id" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'UNPROCESSED',
        "created_by" uuid NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_by" uuid NULL,
        "deleted_at" TIMESTAMP NULL,
        "version" integer NOT NULL DEFAULT 0,
        
        CONSTRAINT "CHK_email_or_phone" CHECK (
          email IS NOT NULL OR phone IS NOT NULL
        )
      )
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "mst_informal_certificate_mappings"
      ADD CONSTRAINT "FK_informal_mapping_license"
      FOREIGN KEY ("license_id") REFERENCES "mst_licenses"("id")
      ON DELETE RESTRICT
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_informal_mapping_email" 
      ON "mst_informal_certificate_mappings"("email")
    `);
    
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_informal_mapping_phone" 
      ON "mst_informal_certificate_mappings"("phone")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_informal_mapping_status" 
      ON "mst_informal_certificate_mappings"("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_informal_mapping_license_id" 
      ON "mst_informal_certificate_mappings"("license_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_informal_mapping_license_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_informal_mapping_status"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_informal_mapping_phone"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_informal_mapping_email"
    `);

    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "mst_informal_certificate_mappings"
      DROP CONSTRAINT IF EXISTS "FK_informal_mapping_license"
    `);

    // Drop table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "mst_informal_certificate_mappings"
    `);
  }
}

