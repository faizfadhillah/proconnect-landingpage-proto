import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNameAndPhotoUrlToInformalCertificateMappings1765626758000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add name column as nullable first (to handle existing rows)
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "mst_informal_certificate_mappings" 
      ADD COLUMN IF NOT EXISTS "name" VARCHAR(255) NULL;
    `);

    // Update existing rows with a default name value
    await queryRunner.query(`
      UPDATE "mst_informal_certificate_mappings" 
      SET "name" = 'Unnamed Mapping'
      WHERE "name" IS NULL;
    `);

    // Now alter column to NOT NULL (all existing rows now have a value)
    await queryRunner.query(`
      ALTER TABLE "mst_informal_certificate_mappings" 
      ALTER COLUMN "name" SET NOT NULL;
    `);

    // Add photo_url column (optional, NULL)
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "mst_informal_certificate_mappings" 
      ADD COLUMN IF NOT EXISTS "photo_url" VARCHAR(500) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop photo_url column
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "mst_informal_certificate_mappings" 
      DROP COLUMN IF EXISTS "photo_url";
    `);

    // Drop name column
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "mst_informal_certificate_mappings" 
      DROP COLUMN IF EXISTS "name";
    `);
  }
}
