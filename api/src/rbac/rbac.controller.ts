// src\rbac\rbac.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Res,
  BadRequestException,
} from "@nestjs/common";
import { RbacService } from "./rbac.service";
import { CreateRbacDto } from "./dto/create-rbac.dto";
import { UpdateRbacDto } from "./dto/update-rbac.dto";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { Rbac } from "./entities/rbac.entity";
import { BasePagination } from "src/base.pagination";
import { FieldsService } from "src/zfields/fields.service";
import { DynamicFiltersDto } from "src/zfields/dto/dynamic-filters.dto";
import { Response } from "express";
import { AssignRouteDto } from "./dto/assign-route.dto";
import { RevokeRouteDto } from "./dto/revoke-route.dto";
import { Public } from "src/auth/public.decorator";

@Controller("rbac")
@ApiTags("rbac")
@ApiBearerAuth()
export class RbacController {
  constructor(
    private readonly rbacService: RbacService,
    private readonly fieldsService: FieldsService,
  ) {}

  @Get("search")
  @ApiOperation({ summary: "Search with filters", operationId: "search" })
  @ApiQuery({ name: "id", required: false })
  @ApiQuery({ name: "expands", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({
    name: "filters",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic filters for searching",
    example: { role_name: "", permissions: "" },
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    type: "object",
    style: "deepObject",
    explode: true,
    description: "Dynamic sorting",
    example: {
      created_at: "DESC",
    },
  })
  @ApiQuery({
    name: "isExcel",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Returns the list of users matching the search criteria.",
    type: BasePagination<Rbac>,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async search(
    @Query("id") id?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("expands") expands?: string,
    @Query("filters") filters?: DynamicFiltersDto,
    @Query("sortBy") sortBy?: any,
    @Query("isExcel") isExcel?: string,
    @Res() res?: Response,
  ) {
    const parsedFilters = this.fieldsService.parseFilters(filters);
    const parsedSortBy = this.fieldsService.parseSortBy(sortBy);
    return this.fieldsService.search(Rbac, {
      id,
      filters: parsedFilters,
      page,
      limit,
      sortBy: parsedSortBy,
      expands,
      isExcel,
      res,
    });
  }

  @Get("all-routes")
  @ApiOperation({
    summary: "List of unassigned routes",
    operationId: "all-routes",
  })
  @ApiResponse({
    status: 201,
    description: "Returns the list of unassigned routes",
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  async allRoutes(@Query("role") rolePermission: string) {
    const routes =
      await this.rbacService.getAllUnassignedRoutes(rolePermission);
    return { items: routes };
  }

  @Post("assign-routes")
  @ApiOperation({ summary: "Assign routes to a role" })
  @ApiResponse({
    status: 201,
    description: "Routes assigned successfully.",
  })
  async assignRoutes(@Body() assignRouteDto: AssignRouteDto) {
    return this.rbacService.assignRoutes(assignRouteDto);
  }

  @Post("revoke-routes")
  @ApiOperation({ summary: "Revoke routes from a role" })
  @ApiResponse({
    status: 201,
    description: "Routes revoked successfully.",
  })
  async revokeRoutes(@Body() revokeRouteDto: RevokeRouteDto) {
    return this.rbacService.revokeRoutes(revokeRouteDto);
  }

  @Get("all-menus")
  async getMenuItems() {
    return this.rbacService.getMenuItems();
  }

  @Post()
  @ApiOperation({ summary: "Create a new RBAC entry", operationId: "create" })
  @ApiResponse({
    status: 201,
    description: "The RBAC entry has been successfully created.",
    type: Rbac,
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  create(@Body() createRbacDto: CreateRbacDto) {
    return this.rbacService.create(createRbacDto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an RBAC entry", operationId: "update" })
  @ApiResponse({
    status: 200,
    description: "The RBAC entry has been successfully updated.",
    type: Rbac,
  })
  @ApiResponse({ status: 404, description: "RBAC entry not found." })
  update(@Param("id") id: string, @Body() updateRbacDto: UpdateRbacDto) {
    return this.rbacService.update(id, updateRbacDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an RBAC entry", operationId: "remove" })
  @ApiResponse({
    status: 204,
    description: "The RBAC entry has been successfully deleted.",
  })
  @ApiResponse({ status: 404, description: "RBAC entry not found." })
  remove(@Param("id") id: string) {
    return this.rbacService.remove(id);
  }

  @Post("seed")
  @ApiOperation({ 
    summary: "Seed RBAC data", 
    description: "Executes RBAC seeding logic similar to migration. Checks for existing entries before inserting."
  })
  @ApiResponse({
    status: 201,
    description: "RBAC seeding completed successfully.",
    schema: {
      type: "object",
      properties: {
        inserted: { type: "number", description: "Number of entries inserted" },
        skipped: { type: "number", description: "Number of entries skipped (already exists)" },
        total: { type: "number", description: "Total number of entries processed" },
        details: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              type: { type: "string" },
              inserted: { type: "boolean" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request." })
  async seedRbac() {
    return this.rbacService.seedRbac();
  }

  @Get("test-route")
  @Public()
  @ApiOperation({
    summary: "Test RBAC route matching",
    description: "Public endpoint to test if a specific path and method would be allowed for a user. Useful for debugging RBAC configurations.",
  })
  @ApiQuery({
    name: "userId",
    required: true,
    description: "User ID to test permissions for",
  })
  @ApiQuery({
    name: "path",
    required: true,
    description: "Request path to test (e.g., '/jobs/123', '/mst-companies/:id')",
  })
  @ApiQuery({
    name: "method",
    required: true,
    description: "HTTP method to test (e.g., 'GET', 'POST', 'PATCH', 'DELETE')",
  })
  @ApiResponse({
    status: 200,
    description: "Returns route matching test results",
    schema: {
      type: "object",
      properties: {
        allowed: { type: "boolean", description: "Whether the route is allowed" },
        userRoles: {
          type: "array",
          items: { type: "string" },
          description: "List of user roles (company roles and regular roles)",
        },
        permissions: {
          type: "array",
          items: { type: "string" },
          description: "List of permissions the user has",
        },
        matchingRoutes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Route path from RBAC" },
              method: { type: "string", description: "Route method from RBAC" },
            },
          },
          description: "List of routes that match the requested path and method",
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Bad request - missing required parameters" })
  async testRoute(
    @Query("userId") userId: string,
    @Query("path") path: string,
    @Query("method") method: string,
  ) {
    if (!userId || !path || !method) {
      throw new BadRequestException("userId, path, and method are required");
    }
    return this.rbacService.testRouteMatch(userId, path, method.toUpperCase());
  }
}
