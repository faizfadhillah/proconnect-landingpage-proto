import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { RbacGuard } from "../rbac/rbac.guard";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class AuthRbacGuard implements CanActivate {
  constructor(
    private readonly authGuard: AuthGuard,
    private readonly rbacGuard: RbacGuard,
    private readonly logger: LoggingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Authentication - Verify Firebase token and get user
      this.logger.debug("Running AuthGuard (Authentication)");
      const authResult = await this.authGuard.canActivate(context);

      if (!authResult) {
        this.logger.warn("Authentication failed");
        return false;
      }

      // Authorization - Check RBAC permissions
      this.logger.debug("Running RbacGuard (Authorization)");
      const rbacResult = await this.rbacGuard.canActivate(context);

      if (!rbacResult) {
        this.logger.warn("Authorization failed");
        return false;
      }

      this.logger.debug("Both authentication and authorization passed");
      return true;

    } catch (error) {
      this.logger.error(`Guard execution failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}