import { Injectable } from "@nestjs/common";
import { CacheService } from "src/common/redis/cache.service";
import { ConfigsService } from "src/config/config.service";
import { parseBypassUserIdsFromConfigValue } from "src/utils/otp-guard-bypass.util";
import { getSecondsUntilNextMidnightUTC7 } from "../utils/rate-limit-time.util";

export const SMS_OTP_VALIDITY_SECONDS = 300; // 5 minutes
const SMS_DAILY_MAX = 2;

export type SmsLimitReason = "cooldown" | "daily_limit";

export interface CheckSmsLimitResult {
  allowed: boolean;
  reason?: SmsLimitReason;
  retryAfterSeconds?: number;
}

function smsAttemptKey(userId: string): string {
  return `notification:rate:sms:attempt:${userId}`;
}

function smsDailyKey(userId: string): string {
  return `notification:rate:sms:daily:${userId}`;
}

const OTP_GUARD_BYPASS_USER_IDS_KEY = "otp_guard_bypass_user_ids";

@Injectable()
export class NotificationRateLimitService {
  constructor(
    private readonly cache: CacheService,
    private readonly configsService: ConfigsService,
  ) {}

  private async getBypassUserIds(): Promise<string[]> {
    const raw = await this.configsService.getValueByKey<unknown>(OTP_GUARD_BYPASS_USER_IDS_KEY, null);
    return parseBypassUserIdsFromConfigValue(raw);
  }

  async checkSmsLimit(userId: string): Promise<CheckSmsLimitResult> {
    const bypassUserIds = await this.getBypassUserIds();
    if (bypassUserIds.includes(userId)) {
      return { allowed: true };
    }

    const attemptKey = smsAttemptKey(userId);
    const attemptExists = await this.cache.exists(attemptKey);
    if (attemptExists) {
      const retryAfterSeconds = await this.cache.ttl(attemptKey);
      return {
        allowed: false,
        reason: "cooldown",
        retryAfterSeconds: retryAfterSeconds > 0 ? retryAfterSeconds : undefined,
      };
    }

    const dailyKey = smsDailyKey(userId);
    const count = await this.cache.get(dailyKey);
    const dailyCount = typeof count === "number" ? count : 0;
    if (dailyCount >= SMS_DAILY_MAX) {
      const retryAfterSeconds = await this.cache.ttl(dailyKey);
      return {
        allowed: false,
        reason: "daily_limit",
        retryAfterSeconds: retryAfterSeconds > 0 ? retryAfterSeconds : undefined,
      };
    }

    return { allowed: true };
  }

  async recordSmsSent(userId: string): Promise<void> {
    const attemptKey = smsAttemptKey(userId);
    const dailyKey = smsDailyKey(userId);

    await this.cache.set(attemptKey, 1, SMS_OTP_VALIDITY_SECONDS);

    const existing = await this.cache.get(dailyKey);
    const ttlUntilMidnight = getSecondsUntilNextMidnightUTC7();
    if (existing == null) {
      await this.cache.set(dailyKey, 1, ttlUntilMidnight);
    } else {
      await this.cache.increment(dailyKey);
    }
  }
}
