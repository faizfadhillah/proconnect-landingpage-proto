import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { MessageCentralService } from "src/notifications/sms/service/message-central.service";
import { EncryptedUserDataService } from "src/encrypted_user_data/encrypted_user_data.service";
import { CacheService } from "src/common/redis/cache.service";
import {
  SMS_VERIFY_NOW_VERIFICATION_CACHE_PREFIX,
  SMS_VERIFY_NOW_VERIFICATION_CACHE_TTL_SECONDS,
} from "src/notifications/sms/constants/constants";
import { normalizePhoneAndCountryCode } from "src/utils/phone.util";
import { LoggingService } from "src/logs/logs.service";
import { UserFieldGuardService } from "./user-field-guard.service";
import { UserFieldGuardType } from "./enums/user-field-guard-type.enum";

@Injectable()
export class SmsOtpService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly messageCentralService: MessageCentralService,
    private readonly encryptedUserDataService: EncryptedUserDataService,
    private readonly cacheService: CacheService,
    private readonly loggingService: LoggingService,
    private readonly userFieldGuardService: UserFieldGuardService,
  ) {}

  async requestOtp(user: User): Promise<void> {
    this.loggingService.log(
      `[sms-otp] requestOtp START user_id=${user.id}`,
      "sms-otp",
    );

    const decrypted = await this.encryptedUserDataService.findOneDecrypted(user.id);
    const phone = decrypted?.encrypted_phone;
    const countryCode = decrypted?.country_code;

    const normalized = normalizePhoneAndCountryCode(phone, countryCode);
    if (!normalized) {
      this.loggingService.warn(
        `[sms-otp] requestOtp FAIL user_id=${user.id} - no phone data`,
        "sms-otp",
      );
      throw new BadRequestException(
        "User has no phone data. Please add phone number first.",
      );
    }

    const { phone: mobileNumber, countryCode: resolvedCountryCode } = normalized;
    this.loggingService.log(
      `[sms-otp] requestOtp user_id=${user.id} normalized countryCode=${resolvedCountryCode} mobile=${mobileNumber.slice(0, 4)}****`,
      "sms-otp",
    );

    const authToken = await this.messageCentralService.getToken();

    const verificationId = await this.messageCentralService.sendVerifyNowOtp(
      authToken,
      {
        countryCode: resolvedCountryCode,
        mobileNumber,
        otpLength: 6,
      },
    );

    const cacheKey = `${SMS_VERIFY_NOW_VERIFICATION_CACHE_PREFIX}${user.id}`;
    const cachePayload = {
      verificationId: String(verificationId),
      countryCode: resolvedCountryCode,
      mobileNumber,
    };
    await this.cacheService.set(
      cacheKey,
      cachePayload,
      SMS_VERIFY_NOW_VERIFICATION_CACHE_TTL_SECONDS,
    );

    this.loggingService.log(
      `[sms-otp] requestOtp SUCCESS user_id=${user.id} verificationId=${verificationId}`,
      "sms-otp",
    );
  }

  async verifyOtp(user: User, code: string): Promise<{ message: string }> {
    this.loggingService.log(
      `[sms-otp] verifyOtp START user_id=${user.id}`,
      "sms-otp",
    );

    const cacheKey = `${SMS_VERIFY_NOW_VERIFICATION_CACHE_PREFIX}${user.id}`;
    const cached = await this.cacheService.get(cacheKey);

    const verificationId =
      typeof cached === "string"
        ? cached
        : cached?.verificationId;
    const countryCode =
      typeof cached === "object" && cached != null
        ? cached.countryCode
        : undefined;
    const mobileNumber =
      typeof cached === "object" && cached != null
        ? cached.mobileNumber
        : undefined;

    if (!verificationId) {
      this.loggingService.warn(
        `[sms-otp] verifyOtp FAIL user_id=${user.id} - OTP expired or not found`,
        "sms-otp",
      );
      throw new NotFoundException(
        "OTP expired or not found. Please request a new OTP.",
      );
    }

    if (!countryCode || !mobileNumber) {
      this.loggingService.warn(
        `[sms-otp] verifyOtp FAIL user_id=${user.id} - missing countryCode/mobileNumber in cache`,
        "sms-otp",
      );
      throw new NotFoundException(
        "OTP expired or not found. Please request a new OTP.",
      );
    }

    const authToken = await this.messageCentralService.getToken();

    await this.messageCentralService.validateVerifyNowOtp(authToken, {
      verificationId: String(verificationId),
      code,
      countryCode,
      mobileNumber,
    });

    user.is_phone_verified = true;
    await this.usersRepository.save(user);
    await this.userFieldGuardService.recordGuard(
      user.id,
      UserFieldGuardType.PHONE,
      `${countryCode}${mobileNumber}`,
    );
    await this.cacheService.del(cacheKey);

    this.loggingService.log(
      `[sms-otp] verifyOtp SUCCESS user_id=${user.id} is_phone_verified=true`,
      "sms-otp",
    );

    return { message: "OTP verified successfully" };
  }
}
