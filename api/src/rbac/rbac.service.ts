// src\rbac\rbac.service.ts
import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { CreateRbacDto } from "./dto/create-rbac.dto";
import { UpdateRbacDto } from "./dto/update-rbac.dto";
import { Rbac, RbacType, RbacMethod } from "./entities/rbac.entity";
import { HttpAdapterHost } from "@nestjs/core";
import { AssignRouteDto } from "./dto/assign-route.dto";
import { RevokeRouteDto } from "./dto/revoke-route.dto";
import { join } from "path";
import { readFileSync } from "fs";
import { RbacDao } from "./dao/rbac.dao";
import { UserRoleAssignmentHistoryResponseDto } from "src/user_role_assignments/dto/user_role_assignment_history_response.dto";
import { UserRoleAssignmentRole } from "src/user_role_assignments/enums/user_role_assignment.enums";
import { UserRolePermissionDto } from "src/users/dto/role.dto";
import { RBAC_SEED_DATA, seedUUID } from "./rbac.seed.constants";
import { UserRoleAssignmentService } from "src/user_role_assignments/services/user_role_assignments.service";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class RbacService {
  private readonly menuItems: any;

  constructor(
    @InjectRepository(Rbac)
    public rbacRepository: Repository<Rbac>,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly rbacDao: RbacDao,
    @Inject(forwardRef(() => UserRoleAssignmentService))
    private readonly userRoleAssignmentService: UserRoleAssignmentService,
    private readonly loggingService: LoggingService,
  ) {
    try {
      // Perbaiki path file - hapus // yang tidak perlu
      const filePath = join(__dirname, "../../../data/menu-items.json");
      const fileContent = readFileSync(filePath, "utf8");
      this.menuItems = JSON.parse(fileContent);
      this.loggingService.log("Menu items loaded successfully", "rbac");
    } catch (error) {
      this.loggingService.error(
        `Failed to load menu items: ${error instanceof Error ? error.message : String(error)}`,
        "rbac",
        error instanceof Error ? error.stack : undefined,
      );
      // Set default empty array jika file tidak ditemukan
      this.menuItems = [];
    }
  }

  getMenuItems() {
    // Pastikan selalu return array, bukan undefined
    return this.menuItems || [];
  }

  async getAllUnassignedRoutes(rolePermission: string) {
    // Get all registered routes
    const httpServer = this.httpAdapterHost.httpAdapter.getInstance();
    let allRoutes = httpServer._router.stack
      .filter((layer) => layer.route) // Only layers with routes
      .map((layer) => {
        const route = layer.route;
        const method = Object.keys(route.methods)[0].toUpperCase();
        return {
          path: route.path,
          method,
        };
      });

    const uniqueEntities = Array.from(
      new Set(
        allRoutes.map((route) => {
          const segments = route.path.split("/").filter((segment) => segment);
          return `/${segments[0]}`; // Ambil hanya entitas utama
        }),
      ),
    );

    // Tambahkan wildcard rute untuk setiap entitas utama
    const wildcardRoutes = uniqueEntities.map((entityPath) => ({
      path: `${entityPath}/*`,
      method: "ALL",
    }));

    allRoutes = [
      ...[{ path: "/*", method: "ALL" }],
      ...wildcardRoutes,
      ...allRoutes,
    ];

    // Get all assigned routes for the specified role
    const assignedRoutes = await this.rbacRepository.find({
      where: { parent_role: rolePermission, type: RbacType.route },
    });

    // Extract paths of assigned routes
    const assignedRoutePaths = assignedRoutes.map(
      (route) => route.name + "|" + route.method,
    );

    // Filter out routes that are already assigned
    const unassignedRoutes = allRoutes.filter(
      (route: any) =>
        !assignedRoutePaths.includes(route.path + "|" + route.method),
    );

    return unassignedRoutes;
  }

  async assignRoutes(assignRouteDto: AssignRouteDto) {
    const { rolePermission, routes } = assignRouteDto;
    const existingRoutes = await this.rbacRepository.find({
      where: { parent_role: rolePermission },
    });

    const rbacEntities = routes.map((droute) => {
      const route = droute.split("|")[0];
      const method = droute.split("|")[1];
      const existingRoute = existingRoutes.find(
        (existing) => existing.name === route && existing.method == method,
      );

      if (existingRoute) {
        return { ...existingRoute };
      } else {
        return this.rbacRepository.create({
          type: RbacType.route,
          name: route,
          parent_role: rolePermission,
          method: method,
        });
      }
    });

    await this.rbacRepository.save(rbacEntities);

    return {
      message: "Routes assigned or updated successfully.",
      routes: routes,
    };
  }

  async revokeRoutes(revokeRouteDto: RevokeRouteDto) {
    const { rolePermission, routes } = revokeRouteDto;
    for (const droute of routes) {
      const route = droute.split("|")[0];
      const method = droute.split("|")[1];

      await this.rbacRepository.softDelete({
        parent_role: rolePermission,
        name: route,
        method: method,
      });
    }

    return { message: "Routes revoked successfully.", revoked: routes };
  }

  async create(createRbacDto: CreateRbacDto): Promise<Rbac> {
    const rbac = this.rbacRepository.create(createRbacDto);
    return await this.rbacRepository.save(rbac);
  }

  async update(id: string, updateRbacDto: UpdateRbacDto): Promise<Rbac> {
    const rbac = await this.rbacRepository.findOne({ where: { id } });
    if (!rbac) {
      throw new NotFoundException(`RBAC entry with ID ${id} not found`);
    }
    Object.assign(rbac, updateRbacDto);
    return await this.rbacRepository.save(rbac);
  }

  async remove(id: string): Promise<void> {
    const result = await this.rbacRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`RBAC entry with ID ${id} not found`);
    }
  }

  /**
   * Get permissions for role assignments
   * Handles the hierarchy: company roles → sub-roles → permissions
   */
  async getPermissionsByUserRoleAssignment(
    roleAssignment: UserRoleAssignmentHistoryResponseDto,
  ): Promise<UserRolePermissionDto[]> {
    if (!roleAssignment) return [];

    // Non employer roles (candidate, admin)
    let parentRole: string;
    if (roleAssignment.role !== UserRoleAssignmentRole.EMPLOYER) {
      parentRole = roleAssignment.role;
    } else {
      parentRole = roleAssignment.company_role;
    }

    const permissions =
      await this.rbacDao.getPermissionsByParentRole(parentRole);

    return permissions.map((permission) =>
      UserRolePermissionDto.fromRbac(permission),
    );
  }

  async getRbacFromUserRoles(userRoles: string[]): Promise<Rbac[]> {
    const rbacs = await this.rbacRepository.findBy({
      name: In(userRoles),
    });

    return rbacs;
  }

  /**
   * Copy RBAC from sys_admin to admin_viewer
   * For routes: only allow GET method, skip PUT/POST/PATCH/DELETE and other modification methods
   * If method is ALL, override to GET
   */
  async seedAdminViewerRbac(): Promise<void> {
    this.loggingService.log(
      "Starting admin_viewer RBAC seeding from sys_admin",
      "rbac-seed",
    );

    // Query: select * from rbac r where name = 'sys_admin' or r.parent_role = 'sys_admin';
    const sysAdminRbac = await this.rbacRepository
      .createQueryBuilder("r")
      .where("r.deleted_at IS NULL")
      .andWhere("(r.name = :name OR r.parent_role = :parentRole)", {
        name: "sys_admin",
        parentRole: "sys_admin",
      })
      .getMany();

    if (sysAdminRbac.length === 0) {
      this.loggingService.warn(
        "No sys_admin RBAC found, skipping admin_viewer RBAC seeding",
        "rbac-seed",
      );
      return;
    }

    this.loggingService.log(
      `Found ${sysAdminRbac.length} RBAC entries from sys_admin`,
      "rbac-seed",
    );

    const adminViewerRbacToInsert: Partial<Rbac>[] = [];

    for (const rbac of sysAdminRbac) {
      // Determine new name and parent_role
      const newName = rbac.name === "sys_admin" ? "admin_viewer" : rbac.name;
      const newParentRole =
        rbac.parent_role === "sys_admin" ? "admin_viewer" : rbac.parent_role;

      // Handle route type: only allow GET, skip modification methods
      let newMethod = rbac.method;
      if (rbac.type === RbacType.route) {
        const methodStr = String(rbac.method || "").toUpperCase();

        // Skip if method is PUT/POST/PATCH/DELETE or other modification methods
        const modificationMethods = ["POST", "PATCH", "DELETE", "PUT"];
        if (modificationMethods.includes(methodStr)) {
          this.loggingService.debug(
            `Skipping route with modification method: ${rbac.name} (${rbac.method})`,
            "rbac-seed",
          );
          continue;
        }

        // If method is ALL, override to GET; otherwise keep original method
        newMethod =
          methodStr === "ALL" || methodStr === RbacMethod.ALL
            ? RbacMethod.GET
            : rbac.method || RbacMethod.GET;
      }

      // Skip if already exists (check with new method for routes)
      const existing = await this.rbacRepository.findOne({
        where: {
          type: rbac.type,
          name: newName,
          parent_role: newParentRole,
          method: newMethod,
          deleted_at: null, // Only check non-deleted entries
        },
      });

      if (existing) {
        this.loggingService.debug(
          `Skipping existing RBAC entry: ${newName} (${rbac.type})`,
          "rbac-seed",
        );
        continue;
      }

      // For non-route types (role, permission, sub_role), copy as is
      adminViewerRbacToInsert.push({
        type: rbac.type,
        name: newName,
        parent_role: newParentRole,
        method: newMethod,
        description: rbac.description,
        meta: rbac.meta,
      });
    }

    if (adminViewerRbacToInsert.length > 0) {
      const newRbacEntities = adminViewerRbacToInsert.map((rbacData) =>
        this.rbacRepository.create(rbacData),
      );
      await this.rbacRepository.save(newRbacEntities);
      this.loggingService.log(
        `Successfully seeded ${newRbacEntities.length} admin_viewer RBAC entries`,
        "rbac-seed",
      );
    } else {
      this.loggingService.log(
        "No new admin_viewer RBAC entries to insert (all already exist)",
        "rbac-seed",
      );
    }
  }

  /**
   * Seed RBAC data - replicates the migration logic
   * Checks for existing entries before inserting, similar to the SQL query pattern
   */
  async seedRbac(): Promise<{
    inserted: number;
    skipped: number;
    total: number;
    details: Array<{ name: string; type: string; inserted: boolean }>;
  }> {
    let inserted = 0;
    let skipped = 0;
    const details: Array<{ name: string; type: string; inserted: boolean }> =
      [];

    // Get all existing RBAC entries once via DAO
    const existingRbacs = await this.rbacDao.getAllRbacEntries();

    // Helper function to check if entry exists - manual filter
    const entryExists = (seedData: {
      type: string;
      name: string;
      parent_role: string | null;
      method: string | null;
    }): boolean => {
      return existingRbacs.some((existing: any) => {
        const typeMatch = existing.type === seedData.type;
        const nameMatch = existing.name === seedData.name;
        const parentRoleMatch =
          existing.parent_role === seedData.parent_role ||
          (existing.parent_role === null && seedData.parent_role === null);
        const methodMatch =
          existing.method === seedData.method ||
          (existing.method === null && seedData.method === null);

        return typeMatch && nameMatch && parentRoleMatch && methodMatch;
      });
    };

    for (const seedData of RBAC_SEED_DATA) {
      // Check if entry already exists using manual filter
      if (!entryExists(seedData)) {
        // Insert via DAO
        await this.rbacDao.insertRbacEntry(seedData, seedUUID);
        inserted++;
        details.push({
          name: seedData.name,
          type: seedData.type,
          inserted: true,
        });
        this.loggingService.log(
          `Inserted RBAC entry: ${seedData.type} - ${seedData.name}`,
          "rbac-seed",
        );
      } else {
        skipped++;
        details.push({
          name: seedData.name,
          type: seedData.type,
          inserted: false,
        });
        this.loggingService.log(
          `Skipped existing RBAC entry: ${seedData.type} - ${seedData.name}`,
          "rbac-seed",
        );
      }
    }

    this.loggingService.log(
      `RBAC seeding completed: ${inserted} inserted, ${skipped} skipped out of ${RBAC_SEED_DATA.length} total`,
      "rbac-seed",
    );

    return {
      inserted,
      skipped,
      total: RBAC_SEED_DATA.length,
      details,
    };
  }

  /**
   * Test RBAC route matching - checks if a path and method would be allowed
   * This method mimics the logic in RbacGuard for testing purposes
   */
  async testRouteMatch(
    userId: string,
    path: string,
    method: string,
  ): Promise<{
    allowed: boolean;
    userRoles: string[];
    permissions: string[];
    matchingRoutes: Array<{ name: string; method: string }>;
  }> {
    // Get role assignments for user
    const roleAssignments =
      await this.userRoleAssignmentService.getActiveByUserId(userId);

    const userRoles = roleAssignments.map((assignment) => assignment.role);
    const companyRoles =
      roleAssignments
        .filter((assignment) => assignment.company_role)
        .map((assignment) => assignment.company_role) || [];

    // Make set combination of company roles and roles
    const rolesSet = new Set([...companyRoles, ...userRoles]);

    // Get permissions for roles
    const permissions = await this.rbacRepository.find({
      where: {
        type: RbacType.permission,
        parent_role: In([...rolesSet]),
      },
    });

    const permissionNames = permissions.map((p) => p.name);

    // Fetch allowed routes for the permissions
    const allowedRoutes = await this.rbacRepository.find({
      where: { type: RbacType.route, parent_role: In(permissionNames) },
    });

    // Import and use the route matcher utility
    const { isRouteAllowed, checkRouteMatch } = await import(
      "./utils/route-matcher.util"
    );
    const allowed = isRouteAllowed(allowedRoutes, path, method);

    // Find matching routes for debugging
    const matchingRoutes = allowedRoutes.filter((route) =>
      checkRouteMatch(route.name, path, route.method, method),
    );

    return {
      allowed,
      userRoles: Array.from(rolesSet),
      permissions: permissionNames,
      matchingRoutes: matchingRoutes.map((r) => ({
        name: r.name,
        method: r.method,
      })),
    };
  }
}
