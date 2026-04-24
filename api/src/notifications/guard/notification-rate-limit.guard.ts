import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { NotificationRateLimitService } from "../service/notification-rate-limit.service";
import { OtpType } from "src/users/enums/otp-type.enum";

@Injectable()
export class NotificationRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: NotificationRateLimitService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const type = request.query?.type;

    if (type !== OtpType.SMS) {
      return true;
    }

    const userId = request.user?.id;
    if (!userId) {
      return true;
    }

    const result = await this.rateLimitService.checkSmsLimit(userId);

    if (result.allowed) {
      return true;
    }

    const retryAfterSeconds = result.retryAfterSeconds ?? 0;
    const minutes = Math.ceil(retryAfterSeconds / 60);

    let message: string;
    if (result.reason === "cooldown") {
      message = `Too many requests. Please wait ${minutes} minute(s) before requesting another OTP.`;
    } else {
      message =
        "Daily OTP limit reached. You can request again after midnight WIB (UTC+7).";
    }

    if (retryAfterSeconds > 0) {
      const response = context.switchToHttp().getResponse();
      response.setHeader("Retry-After", String(retryAfterSeconds));
    }

    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message,
        ...(retryAfterSeconds > 0 && { retryAfterSeconds }),
      },
      HttpStatus.TOO_MANY_REQUESTS,
      { cause: result.reason, description: message },
    );
  }
}
