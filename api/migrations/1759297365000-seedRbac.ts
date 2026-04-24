import { RBAC_SEED_DATA, seedUUID } from "src/rbac/rbac.seed.constants";
import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedRbac1759297365000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const seedData of RBAC_SEED_DATA) {
      // Check if entry already exists
      const existingEntry = await queryRunner.query(
        `SELECT id FROM rbac WHERE type = $1 AND name = $2 AND ((parent_role = $3) OR (parent_role IS NULL AND $3 IS NULL)) AND ((method = $4) OR (method IS NULL AND $4 IS NULL))`,
        [
          seedData.type,
          seedData.name,
          seedData.parent_role,
          seedData.method,
        ]
      );

      if (existingEntry.length === 0) {
        // Build dynamic INSERT query for nullable fields
        const columns = ['id', 'type', 'name', 'description', 'created_at', 'created_by', 'updated_at', 'updated_by'];
        const values = ['uuid_generate_v4()', '$1', '$2', '$3', 'NOW()', '$4', 'NOW()', '$5'];
        const params = [seedData.type, seedData.name, seedData.description, seedUUID, seedUUID];

        let paramIndex = 6;

        // Add parent_role if not null
        if (seedData.parent_role) {
          columns.push('parent_role');
          values.push(`$${paramIndex++}`);
          params.push(seedData.parent_role);
        }

        // Add method if not null
        if (seedData.method) {
          columns.push('method');
          values.push(`$${paramIndex++}`);
          params.push(seedData.method);
        }

        // Add meta if not null
        if (seedData.meta) {
          columns.push('meta');
          values.push(`$${paramIndex++}`);
          params.push(JSON.stringify(seedData.meta));
        }

        const insertQuery = `INSERT INTO rbac (${columns.join(', ')}) VALUES (${values.join(', ')})`;

        await queryRunner.query(insertQuery, params);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM rbac WHERE created_by = $1`,
      [seedUUID]
    );
  }
}