export const MESSAGE_CENTRAL_BASE_URL = 'https://cpaas.messagecentral.com';

export const MESSAGE_CENTRAL_ENDPOINTS = {
  GET_TOKEN: '/auth/v1/authentication/token',
  SEND_OTP: '/verification/v3/send',
  VALIDATE_OTP: '/verification/v3/validateOtp',
};

export const SMS_FLOW_TYPE = 'SMS';

/** Redis cache key for Message Central auth token */
export const MESSAGE_CENTRAL_AUTH_TOKEN_CACHE_KEY = 'sms:message-central:auth-token';
/** TTL 1 day (seconds) — refresh token once per day */
export const MESSAGE_CENTRAL_AUTH_TOKEN_CACHE_TTL_SECONDS = 24 * 60 * 60;

/** Redis cache key prefix for VerifyNow verificationId per user */
export const SMS_VERIFY_NOW_VERIFICATION_CACHE_PREFIX = 'sms:verify_now:user:';
/** TTL for verificationId (seconds) — matches VerifyNow timeout */
export const SMS_VERIFY_NOW_VERIFICATION_CACHE_TTL_SECONDS = 300;
