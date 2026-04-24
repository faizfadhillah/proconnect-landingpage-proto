import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigsService } from "src/config/config.service";
import { LoggingService } from "src/logs/logs.service";
import { parseBypassUserIdsFromConfigValue } from "src/utils/otp-guard-bypass.util";
import { UserFieldGuardDao } from "./dao/user-field-guard.dao";
import { UserFieldGuardType } from "./enums/user-field-guard-type.enum";
import { OtpEligibilityResponseDto } from "./dto/otp-eligibility-response.dto";

const GUARD_DAYS = 7;
const OTP_GUARD_BYPASS_USER_IDS_KEY = "otp_guard_bypass_user_ids";
const LOG_TAG = "user-field-guard";

@Injectable()
export class UserFieldGuardService {
  constructor(
    private readonly userFieldGuardDao: UserFieldGuardDao,
    private readonly configsService: ConfigsService,
    private readonly loggingService: LoggingService,
  ) {}

  private async getBypassUserIds(): Promise<string[]> {
    const raw = await this.configsService.getValueByKey<unknown>(OTP_GUARD_BYPASS_USER_IDS_KEY, null);
    return parseBypassUserIdsFromConfigValue(raw);
  }

  /**
   * Throws BadRequestException if the user cannot change the given field yet (still within guard period).
   */
  async assertCanChange(userId: string, type: UserFieldGuardType): Promise<void> {
    const bypassUserIds = await this.getBypassUserIds();
    if (bypassUserIds.includes(userId)) {
      this.loggingService.log(
        `assertCanChange bypassed userId=${userId} type=${type}`,
        LOG_TAG,
      );
      return;
    }

    const guard = await this.userFieldGuardDao.findByUserAndType(userId, type);
    if (!guard) return;
    const now = new Date();
    if (guard.guarded_until > now) {
      const fieldLabel = type === UserFieldGuardType.EMAIL ? "Email" : "Phone number";
      this.loggingService.log(
        `assertCanChange blocked userId=${userId} type=${type} guarded_until=${guard.guarded_until.toISOString()}`,
        LOG_TAG,
      );
      throw new BadRequestException(
        `${fieldLabel} cannot be changed again until ${guard.guarded_until.toISOString()}. Please try again after this date.`,
      );
    }
  }

  /**
   * Returns whether the user is eligible to send OTP for the given field type.
   * - No guard or guard expired: eligible true, eligibleAt null.
   * - Guard active: eligible false, eligibleAt is when they can send OTP again.
   */
  async getOtpEligibility(
    userId: string,
    type: UserFieldGuardType,
  ): Promise<OtpEligibilityResponseDto> {
    const bypassUserIds = await this.getBypassUserIds();
    if (bypassUserIds.includes(userId)) {
      this.loggingService.log(
        `getOtpEligibility bypassed userId=${userId} type=${type} -> eligible=true`,
        LOG_TAG,
      );
      return { eligible: true, eligibleAt: null };
    }

    const guard = await this.userFieldGuardDao.findByUserAndType(userId, type);
    const now = new Date();
    if (!guard || guard.guarded_until <= now) {
      return { eligible: true, eligibleAt: null };
    }
    this.loggingService.log(
      `getOtpEligibility not eligible userId=${userId} type=${type} eligibleAt=${guard.guarded_until.toISOString()}`,
      LOG_TAG,
    );
    return {
      eligible: false,
      eligibleAt: guard.guarded_until.toISOString(),
    };
  }

  /**
   * Records that the user changed the field; guard is set for 7 days from now.
   */
  async recordGuard(
    userId: string,
    type: UserFieldGuardType,
    identifier?: string,
  ): Promise<void> {
    const guardedUntil = new Date();
    guardedUntil.setDate(guardedUntil.getDate() + GUARD_DAYS);
    await this.userFieldGuardDao.upsert(userId, type, guardedUntil, identifier);
    this.loggingService.log(
      `recordGuard recorded userId=${userId} type=${type} guarded_until=${guardedUntil.toISOString()}`,
      LOG_TAG,
    );
  }
}
