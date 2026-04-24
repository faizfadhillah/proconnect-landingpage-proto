/**
 * Mailjet API Response DTOs
 * 
 * These interfaces define the structure of Mailjet API responses
 * for both success and error scenarios.
 */

/**
 * Mailjet Error Detail Interface
 * Represents individual error information in error responses
 */
export interface MailjetErrorDetail {
  /** Unique identifier for the error */
  ErrorIdentifier: string;
  /** Mailjet-specific error code */
  ErrorCode: string;
  /** HTTP status code */
  StatusCode: number;
  /** Human-readable error message */
  ErrorMessage: string;
  /** Array of fields related to the error */
  ErrorRelatedTo: string[];
}

/**
 * Mailjet Error Message Interface
 * Represents an error message in the Messages array
 */
export interface MailjetErrorMessage {
  /** Status of the message - always "error" for error responses */
  Status: 'error';
  /** Array of error details */
  Errors: MailjetErrorDetail[];
}

/**
 * Mailjet Success Recipient Interface
 * Represents recipient information in successful responses
 */
export interface MailjetSuccessRecipient {
  /** Email address of the recipient */
  Email: string;
  /** Unique identifier for the message */
  MessageUUID: string;
  /** Mailjet message ID */
  MessageID: number;
  /** URL to access message details */
  MessageHref: string;
}

/**
 * Mailjet Success Message Interface
 * Represents a successful message in the Messages array
 */
export interface MailjetSuccessMessage {
  /** Status of the message - always "success" for successful responses */
  Status: 'success';
  /** Custom ID if provided */
  CustomID: string;
  /** Array of primary recipients */
  To: MailjetSuccessRecipient[];
  /** Array of CC recipients */
  Cc: MailjetSuccessRecipient[];
  /** Array of BCC recipients */
  Bcc: MailjetSuccessRecipient[];
}

/**
 * Mailjet Success Response Interface
 * Represents a successful Mailjet API response
 */
export interface MailjetSuccessResponse {
  /** Array of message responses (typically contains one message) */
  Messages: MailjetSuccessMessage[];
}

/**
 * Mailjet Error Response Interface
 * Represents an error Mailjet API response
 */
export interface MailjetErrorResponse {
  /** Array of error messages (typically contains one message) */
  Messages: MailjetErrorMessage[];
}

/**
 * Mailjet Response Union Type
 * Represents either a success or error response from Mailjet API
 */
export type MailjetResponse = MailjetSuccessResponse | MailjetErrorResponse;

/**
 * Helper function to check if a Mailjet response is successful
 * @param response - The Mailjet response to check
 * @returns boolean indicating if the response is successful
 */
export function isMailjetSuccessResponse(response: MailjetResponse): response is MailjetSuccessResponse {
  return response.Messages?.[0]?.Status === 'success';
}

/**
 * Helper function to check if a Mailjet response is an error
 * @param response - The Mailjet response to check
 * @returns boolean indicating if the response is an error
 */
export function isMailjetErrorResponse(response: MailjetResponse): response is MailjetErrorResponse {
  return response.Messages?.[0]?.Status === 'error';
}

/**
 * Helper function to get the first message from a Mailjet response
 * @param response - The Mailjet response
 * @returns The first message or undefined if no messages
 */
export function getFirstMailjetMessage(response: MailjetResponse) {
  return response.Messages?.[0];
}

/**
 * Helper function to get all errors from a Mailjet error response
 * @param response - The Mailjet error response
 * @returns Array of error details or empty array if no errors
 */
export function getMailjetErrors(response: MailjetErrorResponse): MailjetErrorDetail[] {
  return response.Messages?.[0]?.Errors || [];
}

/**
 * Determines if a Mailjet error is retryable based on status code and error details
 * @param statusCode - HTTP status code from the error
 * @param errorCode - Mailjet-specific error code (optional)
 * @param errorMessage - Error message (optional)
 * @returns boolean indicating if the error is retryable
 */
export function isRetryable(statusCode: number, errorCode?: string, errorMessage?: string): boolean {
  // Rate limit - always retryable after appropriate delay
  if (statusCode === 429) {
    return true;
  }

  // Server errors (5xx) - typically temporary and retryable
  if (statusCode >= 500 && statusCode < 600) {
    return true;
  }

  // Specific Mailjet error codes that indicate transient issues
  if (errorCode) {
    const lcErrorCode = errorCode.toLowerCase();
    
    // Mailjet transient error codes (based on common patterns)
    const retryableErrorCodes = [
      'mj-0003', // Service temporarily unavailable
      'mj-0011', // Internal server error
      'mj-0012', // Service unavailable
      'mj-0013', // Timeout
      'mj-0014', // Connection error
      'mj-0015', // Gateway timeout
      'mj-0016', // Bad gateway
    ];

    if (retryableErrorCodes.some(code => lcErrorCode.includes(code))) {
      return true;
    }
  }

  // Check error message for transient indicators
  if (errorMessage) {
    const lcErrorMessage = errorMessage.toLowerCase();
    const transientIndicators = [
      'timeout',
      'temporarily',
      'unavailable',
      'retry',
      'busy',
      'overloaded',
      'connection',
      'network',
      'gateway',
      'internal server',
      'service error',
    ];

    if (transientIndicators.some(indicator => lcErrorMessage.includes(indicator))) {
      return true;
    }
  }

  return false;
}

/**
 * Helper function to check if a Mailjet error response contains retryable errors
 * @param response - The Mailjet error response
 * @returns boolean indicating if any error in the response is retryable
 */
export function hasRetryableErrors(response: MailjetErrorResponse): boolean {
  const errors = getMailjetErrors(response);
  return errors.some(error =>
    isRetryable(error.StatusCode, error.ErrorCode, error.ErrorMessage)
  );
}

/**
 * Helper function to get all error messages from a Mailjet error response as a comma-separated string
 * @param response - The Mailjet error response
 * @returns Comma-separated string of all error messages
 */
export function getMailjetErrorMessages(response: MailjetErrorResponse): string {
  const errors = getMailjetErrors(response);
  return errors.map(error => error.ErrorMessage).join(', ');
}