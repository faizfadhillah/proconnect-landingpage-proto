import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Rbac, RbacType } from '../entities/rbac.entity';

@Injectable()
export class RbacDao {
  constructor(
    @InjectRepository(Rbac)
    private rbacRepository: Repository<Rbac>,
    private readonly dataSource: DataSource,
  ) { }

  public async getPermissionsByParentRole(parentRole: string): Promise<Rbac[]> {
    // Get permissions for parent role
    return await this.rbacRepository.find({
      where: {
        type: RbacType.permission,
        parent_role: parentRole
      },
    });
  }

  /**
   * Get all RBAC entries (for seeding check)
   */
  public async getAllRbacEntries(): Promise<Array<{ type: string; name: string; parent_role: string | null; method: string | null }>> {
    return await this.dataSource.query(
      `SELECT type, name, parent_role, method FROM rbac`
    );
  }

  /**
   * Insert RBAC entry with dynamic columns based on nullable fields
   */
  public async insertRbacEntry(seedData: {
    type: string;
    name: string;
    parent_role: string | null;
    method: string | null;
    description: string;
    meta: any | null;
  }, seedUUID: string): Promise<void> {
    // Build dynamic INSERT query for nullable fields - same as migration
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

    await this.dataSource.query(insertQuery, params);
  }
}