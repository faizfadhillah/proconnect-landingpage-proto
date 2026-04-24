import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthService } from "./auth.service";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { RequestContextService } from "../common/request-context/request-context.service";
import { UsersService } from "../users/users.service";
import { LoggingService } from "../logs/logs.service";
import { UserRoleAssignmentService } from "src/user_role_assignments/services/user_role_assignments.service";
import { UserRoleAssignmentRole } from "src/user_role_assignments/enums/user_role_assignment.enums";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
    private usersService: UsersService,
    private loggingService: LoggingService,
    private userRoleAssignmentService: UserRoleAssignmentService,
    private requestContextService: RequestContextService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      await this.loggingService.logMessage(
        "info",
        `Public endpoint accessed - ${method} ${url}`,
        "auth-guard",
        { ip, method, url, isPublic: true },
      );
      return true;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      await this.loggingService.logMessage(
        "warn",
        `Missing authorization header - ${method} ${url}`,
        "auth-guard",
        { ip, method, url, error: "No authorization header" },
      );
      throw new UnauthorizedException("Invalid Credentials");
    }

    const token = authHeader.split(" ")[1];

    try {
      const firebaseUser = await this.authService.verifyFirebaseToken(token);
      request.firebaseUser = firebaseUser;

      request.user = await this.usersService.findByFirebaseUid(
        firebaseUser.uid,
      );
      this.requestContextService.setCurrentUserId(request.user.id);

      // Get active assignments once and check roles
      const activeAssignments = await this.userRoleAssignmentService.getActiveByUserId(request.user.id);
      request.user.isSysAdmin = activeAssignments.some(
        assignment => assignment.role === UserRoleAssignmentRole.SYS_ADMIN
      );
      this.requestContextService.setCurrentUserIsSysAdmin(request.user.isSysAdmin);

      request.user.isCandidate = activeAssignments.some(
        assignment => assignment.role === UserRoleAssignmentRole.CANDIDATE
      );
      this.requestContextService.setCurrentUserIsCandidate(request.user.isCandidate);

      request.user.isEmployer = activeAssignments.some(
        assignment =>
          assignment.role === UserRoleAssignmentRole.EMPLOYER
      );
      this.requestContextService.setCurrentUserIsEmployer(request.user.isEmployer);

      // Log successful authentication
      await this.loggingService.logMessage(
        "info",
        `Authentication successful - ${method} ${url}`,
        "auth-guard",
        {
          ip,
          method,
          url,
          userId: request.user.id,
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
        },
      );

      return true;
    } catch (error) {
      // Log authentication failure
      // Truncate error message and stack to prevent database errors
      const errorMessage = error?.message || error?.response?.message || "Unknown error";
      const errorStack = error?.stack ? error.stack.substring(0, 1000) : null;
      
      await this.loggingService.logMessage(
        "error",
        `Authentication failed - ${method} ${url}: ${errorMessage.substring(0, 200)}`,
        "auth-guard",
        {
          ip,
          method,
          url,
          error: errorMessage.substring(0, 500),
          stack: errorStack,
          firebaseUid: error?.firebaseUid || null,
        },
      );

      if (error?.response?.message?.includes("not found")) {
        throw new UnauthorizedException(
          "User is not registered. Please create an account first",
        );
      } else {
        throw new UnauthorizedException(error.response?.message);
      }
    }
  }

}
