import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  MESSAGE_CENTRAL_AUTH_TOKEN_CACHE_KEY,
  MESSAGE_CENTRAL_AUTH_TOKEN_CACHE_TTL_SECONDS,
  MESSAGE_CENTRAL_BASE_URL,
  MESSAGE_CENTRAL_ENDPOINTS,
  SMS_FLOW_TYPE,
} from '../constants/constants';
import {
  MessageCentralTokenResponse,
  MessageCentralVerifyNowSendResponse,
  MessageCentralValidateOtpResponse,
  VerifyNowSendParams,
} from '../interfaces/message-central.interface';
import { CacheService } from 'src/common/redis/cache.service';
import { LoggingService } from 'src/logs/logs.service';
import { stripTokenQuotes } from 'src/utils/string.util';

@Injectable()
export class MessageCentralService {
  private readonly customerId: string;
  private readonly base64Password: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly loggingService: LoggingService,
  ) {
    this.customerId = this.configService.getOrThrow<string>('MESSAGE_CENTRAL_CUSTOMER_ID');
    const rawPassword = this.configService.getOrThrow<string>('MESSAGE_CENTRAL_PASSWORD');
    this.base64Password = Buffer.from(rawPassword).toString('base64');
  }

  async getToken(): Promise<string> {
    const cached = await this.cacheService.get(MESSAGE_CENTRAL_AUTH_TOKEN_CACHE_KEY);
    if (cached && typeof cached === 'string') {
      this.loggingService.log('Using cached Message Central auth token');
      return stripTokenQuotes(cached);
    }

    const url = `${MESSAGE_CENTRAL_BASE_URL}${MESSAGE_CENTRAL_ENDPOINTS.GET_TOKEN}`;

    this.loggingService.log('Fetching Message Central auth token');

    const response = await firstValueFrom(
      this.httpService.get<MessageCentralTokenResponse>(url, {
        params: {
          customerId: this.customerId,
          key: this.base64Password,
          scope: 'NEW',
        },
        headers: { accept: '*/*' },
      }),
    );

    const rawToken = response.data?.token;
    if (!rawToken) {
      this.loggingService.error(
        `Failed to retrieve auth token from Message Central: ${JSON.stringify(response.data)}`,
      );
      throw new InternalServerErrorException('Failed to retrieve SMS auth token');
    }

    const token = stripTokenQuotes(rawToken);

    await this.cacheService.set(
      MESSAGE_CENTRAL_AUTH_TOKEN_CACHE_KEY,
      token,
      MESSAGE_CENTRAL_AUTH_TOKEN_CACHE_TTL_SECONDS,
    );
    this.loggingService.log('Message Central auth token retrieved and cached (TTL 1 day)');
    return token;
  }

  async sendVerifyNowOtp(
    authToken: string,
    params: VerifyNowSendParams,
  ): Promise<string> {
    const url = `${MESSAGE_CENTRAL_BASE_URL}${MESSAGE_CENTRAL_ENDPOINTS.SEND_OTP}`;

    this.loggingService.log(
      `Sending VerifyNow OTP to ${params.countryCode}${params.mobileNumber}`,
    );

    const requestParams: Record<string, string | number> = {
      countryCode: params.countryCode,
      mobileNumber: params.mobileNumber,
      flowType: SMS_FLOW_TYPE,
    };
    if (params.otpLength != null) {
      requestParams.otpLength = params.otpLength;
    }

    const response = await firstValueFrom(
      this.httpService.post<MessageCentralVerifyNowSendResponse>(url, null, {
        params: requestParams,
        headers: { authToken },
      }),
    );

    const verificationId = response.data?.data?.verificationId;
    if (!verificationId) {
      this.loggingService.error(
        `VerifyNow send failed: ${JSON.stringify(response.data)}`,
      );
      throw new InternalServerErrorException('Failed to send OTP via VerifyNow');
    }

    this.loggingService.log(
      `VerifyNow OTP sent to ${params.countryCode}${params.mobileNumber}, verificationId: ${verificationId}`,
    );

    return verificationId;
  }

  async validateVerifyNowOtp(
    authToken: string,
    params: {
      verificationId: string;
      code: string;
      countryCode: string;
      mobileNumber: string;
    },
  ): Promise<void> {
    const url = `${MESSAGE_CENTRAL_BASE_URL}${MESSAGE_CENTRAL_ENDPOINTS.VALIDATE_OTP}`;

    this.loggingService.log(
      `Validating VerifyNow OTP for verificationId: ${params.verificationId}`,
    );

    const requestParams = {
      countryCode: params.countryCode,
      mobileNumber: params.mobileNumber,
      verificationId: params.verificationId,
      customerId: this.customerId,
      code: params.code,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get<MessageCentralValidateOtpResponse>(url, {
          params: requestParams,
          headers: { authToken },
        }),
      );

      const data = response.data?.data;
      const status = data?.verificationStatus;
      const responseCode =
        response.data?.responseCode ?? (data as any)?.responseCode;

      if (
        (responseCode !== 200 && responseCode !== '200') ||
        (status && status !== 'VERIFICATION_COMPLETED')
      ) {
        const errMsg =
          data?.errorMessage ??
          response.data?.message ??
          'Verification failed';
        this.loggingService.error(`VerifyNow validate failed: ${errMsg}`);
        throw new BadRequestException('Invalid or expired OTP');
      }

      this.loggingService.log(
        `VerifyNow OTP validated successfully for verificationId: ${params.verificationId}`,
      );
    } catch (error: any) {
      if (error instanceof BadRequestException) throw error;
      const status = error?.response?.data?.responseCode;
      const errMsg =
        error?.response?.data?.message ??
        error?.response?.data?.data?.errorMessage;
      if (status === 702) {
        throw new BadRequestException('Invalid or expired OTP');
      }
      if (status === 705) {
        throw new NotFoundException(
          'OTP has expired. Please request a new one.',
        );
      }
      if (status === 703) {
        throw new BadRequestException('OTP already verified');
      }
      this.loggingService.error(
        `VerifyNow validate error: ${errMsg ?? error?.message}`,
      );
      throw new BadRequestException('Invalid or expired OTP');
    }
  }
}
