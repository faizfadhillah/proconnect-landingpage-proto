import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { AuthGuard } from "./auth.guard";
import { AuthMiddleware } from "./auth.middleware";
import { UsersModule } from "../users/users.module"; // Import UsersModule
import { LogsModule } from "src/logs/logs.module";
import { UserRoleAssignmentsModule } from "src/user_role_assignments/user_role_assignments.module";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get("JWT_SECRET"),
        signOptions: {
          expiresIn: config.get("JWT_EXPIRATION"),
        },
      }),
    }),
    forwardRef(() => UsersModule),
    LogsModule,
    UserRoleAssignmentsModule
  ],
  providers: [AuthService, JwtStrategy, AuthGuard, AuthMiddleware],
  exports: [AuthService, JwtModule, AuthGuard, AuthMiddleware],
})
export class AuthModule { }
