import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSchoolIdToUserRoleAssignments1763117337655 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Note: PIC_SCHOOL enum value is handled by app code (UserRoleAssignmentRole enum)
    // No database enum modification needed
    
    // 1. Add school_id column to user_role_assignments
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments" 
      ADD COLUMN IF NOT EXISTS "school_id" uuid NULL
    `);

    // 2. Add FK constraint to mst_schools
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments"
      ADD CONSTRAINT "FK_user_role_assignments_school"
      FOREIGN KEY ("school_id") REFERENCES "mst_schools"("id")
      ON DELETE RESTRICT
    `);

    // 3. Create index on school_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_role_assignments_school_id" 
      ON "user_role_assignments" ("school_id")
    `);

    // 4. Add school_id column to user_role_assignment_history
    await queryRunner.query(`
      ALTER TABLE "user_role_assignment_history" 
      ADD COLUMN IF NOT EXISTS "school_id" uuid NULL
    `);

    // 5. Add FK constraint to user_role_assignment_history
    await queryRunner.query(`
      ALTER TABLE "user_role_assignment_history"
      ADD CONSTRAINT "FK_user_role_assignment_history_school"
      FOREIGN KEY ("school_id") REFERENCES "mst_schools"("id")
      ON DELETE RESTRICT
    `);

    // 6. Create index on school_id for user_role_assignment_history
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_user_role_assignment_history_school_id" 
      ON "user_role_assignment_history" ("school_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_role_assignment_history_school_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_role_assignment_history"
      DROP CONSTRAINT IF EXISTS "FK_user_role_assignment_history_school"
    `);
    
    await queryRunner.query(`
      ALTER TABLE "user_role_assignment_history"
      DROP COLUMN IF EXISTS "school_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_user_role_assignments_school_id"
    `);
    
    await queryRunner.query(`
      ALTER TABLE "user_role_assignments"
      DROP CONSTRAINT IF EXISTS "FK_user_role_assignments_school"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_role_assignments"
      DROP COLUMN IF EXISTS "school_id"
    `);
  }
}

