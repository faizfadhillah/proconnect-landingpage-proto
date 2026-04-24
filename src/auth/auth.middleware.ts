import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { AuthService } from "./auth.service";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly clsService: ClsService,
    private readonly authService: AuthService,
    private readonly logger: LoggingService,
  ) {}

  async use(req: any, res: any, next: () => void) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException("Authorization header missing");
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = await this.authService.verifyJwtToken(token);
      this.clsService.set("user", decoded);
      next();
    } catch {
      try {
        const firebaseUser = await this.authService.verifyFirebaseToken(token);
        this.clsService.set("user", firebaseUser);
        this.logger.debug("Firebase token verified", "auth-middleware");
        next();
      } catch (firebaseError) {
        this.logger.debug(
          `Firebase token verification failed: ${firebaseError instanceof Error ? firebaseError.message : String(firebaseError)}`,
          "auth-middleware",
        );
        throw new UnauthorizedException("Invalid token");
      }
    }
  }
}
