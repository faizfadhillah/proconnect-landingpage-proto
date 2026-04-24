import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { In, Repository } from "typeorm";
import { Rbac, RbacType } from "./entities/rbac.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "src/auth/public.decorator";
import { UserRoleAssignmentService } from "src/user_role_assignments/services/user_role_assignments.service";
import { UserRoleAssignmentHistoryDao } from "src/user_role_assignments/dao/user_role_assignment_history.dao";
import { UserRoleAssignmentHistoryResponseDto } from "src/user_role_assignments/dto/user_role_assignment_history_response.dto";
import { UserRoleAssignmentRole, UserRoleAssignmentStatus } from "src/user_role_assignments/enums/user_role_assignment.enums";
import { LoggingService } from "src/logs/logs.service";
import { isRouteAllowed } from "./utils/route-matcher.util";

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Rbac)
    private readonly rbacRepository: Repository<Rbac>, // Inject the repository
    @Inject(forwardRef(() => UserRoleAssignmentService))
    private readonly userRoleAssignmentService: UserRoleAssignmentService,
    private readonly userRoleAssignmentHistoryDao: UserRoleAssignmentHistoryDao,
    private readonly logger: LoggingService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Feature flag: if RBAC is disabled, allow all access
    const rbacEnabled = process.env.RBAC_ENABLED !== 'false';
    if (!rbacEnabled) {
      this.logger.log("RBAC is disabled. Allowing access.");
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("User not authenticated.");
    }

    // Get from history (not just active) to check if user has any assignment
    const histories = await this.userRoleAssignmentHistoryDao.findHistoryByUserId(user.id);

    // If 0 assignments, allow access (user baru yang belum punya role assignment)
    if (histories.length === 0) {
      // Verify user has firebase uid (already authenticated)
      if (request.firebaseUser?.uid) {
        return true;
      }
    }

    // Check if all are INACTIVE
    if (histories.length > 0) {
      const allInactive = histories.every(h => h.status === UserRoleAssignmentStatus.INACTIVE);
      if (allInactive) {
        this.logger.log(`All role assignments are INACTIVE for user: ${user.id}`);
        throw new ForbiddenException("All role assignments are inactive");
      }
    }

    // Filter only ACTIVE assignments for permission check
    const activeHistories = histories.filter(h => h.status === UserRoleAssignmentStatus.ACTIVE);

    // Convert to role assignments format using DTO (similar to getActiveByUserId)
    const roleAssignments = activeHistories.map(h => 
      UserRoleAssignmentHistoryResponseDto.fromEntity(h)
    );

    // if role contains sys_admin, return true
    if (roleAssignments.some(assignment => assignment.role === UserRoleAssignmentRole.SYS_ADMIN)) {
      return true;
    }

    // Retrieve permissions for company roles
    const companyRoles = roleAssignments
      .filter(assignment => assignment.company_role)
      .map(assignment => assignment.company_role) || [];

    // Retrieve permission for from roles
    const roles = roleAssignments
      .map(assignment => assignment.role) || [];

    // make set combination of company roles and roles
    const rolesSet = new Set([...companyRoles, ...roles]);

    // Get permissions for company roles
    const permissions = await this.rbacRepository.find({
      where: {
        type: RbacType.permission,
        parent_role: In([...rolesSet])
      },
    });

    const permissionNames = permissions.map(p => p.name);

    // Combine permission names and roles to fetch routes in a single query
    // Routes can be accessed via: Role -> Permission -> Route OR Role -> Route
    const allParentRoles = [...new Set([...permissionNames, ...rolesSet])];
    
    // Fetch all allowed routes in one query
    const allowedRoutes = allParentRoles.length > 0
      ? await this.rbacRepository.find({
          where: { 
            type: RbacType.route, 
            parent_role: In(allParentRoles) 
          },
        })
      : [];

    const requestPath = request.path;
    const requestMethod = request.method;
    const isAllowed = isRouteAllowed(allowedRoutes, requestPath, requestMethod);

    if (isAllowed) {
      return true;
    }

    this.logger.log(`${user.id} is not allowed to access ${requestPath} ${requestMethod} | enabled permissions ${permissionNames}`);
    throw new ForbiddenException("Access denied.");
  }
}
