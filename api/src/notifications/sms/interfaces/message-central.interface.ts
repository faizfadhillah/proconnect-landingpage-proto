export interface MessageCentralTokenResponse {
  status: number;
  token: string;
}

export interface MessageCentralVerifyNowSendData {
  verificationId: string;
  mobileNumber: string;
  responseCode: string;
  errorMessage: string | null;
  timeout: string;
  smsCLI: string | null;
  transactionId: string;
}

export interface MessageCentralVerifyNowSendResponse {
  responseCode: number;
  message: string;
  data: MessageCentralVerifyNowSendData;
}

export interface VerifyNowSendParams {
  countryCode: string;
  mobileNumber: string;
  otpLength?: number;
}

export interface MessageCentralValidateOtpData {
  verficationId: string;
  mobileNumber: string;
  responseCode: string;
  errorMessage: string | null;
  verificationStatus: string;
  authToken: string | null;
  transactionId: string;
}

export interface MessageCentralValidateOtpResponse {
  responseCode: number;
  message: string;
  data: MessageCentralValidateOtpData;
}
