import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from 'src/logs/logs.service';

export interface ErrorResponse {
  success: boolean;
  message: string[];
  error?: string;
  statusCode?: number;
  timestamp?: string;
  path?: string;
}

@Injectable()
@Catch()
export class BackendExceptionFilter implements ExceptionFilter {
  constructor(
    private logger: LoggingService,
  ) { }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Check if response has already been sent
    if (response.headersSent) {
      return;
    }

    // Generate error response using shared method
    const { status, errorResponse } = this.generateErrorResponse(exception, request.url);
    
    // Use first message for logging
    const firstMessage = errorResponse.message.length > 0 ? errorResponse.message[0] : 'Unknown error';

    // Safely extract exception info without circular references
    const exceptionInfo = this.sanitizeException(exception);

    // Log the error for debugging (single comprehensive log)
    try {
      this.logger.error(
        `HTTP ${status} Error: ${firstMessage} Data: ${JSON.stringify({
          url: request.url,
          method: request.method,
          userAgent: request.get('User-Agent'),
          ip: request.ip,
          exception: exceptionInfo
        })}`,
        'exception-filter',
      );
    } catch (logError) {
      // If logging fails, just log the basic info
      this.logger.error(
        `HTTP ${status} Error: ${firstMessage} - URL: ${request.url} - Method: ${request.method}`,
        'exception-filter',
      );
    }

    // Double check before sending response to prevent ERR_HTTP_HEADERS_SENT
    if (response.headersSent) {
      return;
    }

    try {
      response.status(status).json(errorResponse);
    } catch (responseError: any) {
      // If response already sent (ERR_HTTP_HEADERS_SENT), just ignore it
      // This can happen if another interceptor or handler already sent the response
      if (responseError?.code === 'ERR_HTTP_HEADERS_SENT' || response.headersSent) {
        // Response already sent, nothing to do
        return;
      }
      // For other errors, re-throw
      throw responseError;
    }
  }

    /**
   * Generate error response payload from exception
   * This method can be called from other components (e.g., LoggingInterceptor) to get consistent error response format
   */
    public generateErrorResponse(exception: unknown, path: string): { status: number; errorResponse: ErrorResponse } {
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      let error = 'Internal Server Error';
  
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const exceptionResponse = exception.getResponse();
  
        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
          const responseObj = exceptionResponse as any;
          message = responseObj.message || responseObj.error || 'Unknown error';
          error = responseObj.error || (typeof message === 'string' ? message : 'Unknown error');
        }
      } else if (exception instanceof Error) {
        message = exception.message;
        error = exception.name;
      }
  
      // Flatten messages to ensure consistent format (no nested arrays)
      const flattenedMessages = this.flattenMessages(message);
  
      const errorResponse: ErrorResponse = {
        success: false,
        message: flattenedMessages,
        error,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path,
      };
  
      return { status, errorResponse };
    }

  /**
   * Flatten nested arrays in messages to ensure consistent format
   * Handles cases like: string, string[], string[][], etc.
   */
  private flattenMessages(messages: any): string[] {
    if (!messages) {
      return ['Unknown error'];
    }

    // If it's already a string, return as array
    if (typeof messages === 'string') {
      return [messages];
    }

    // If it's an array, flatten recursively
    if (Array.isArray(messages)) {
      const flattened: string[] = [];
      for (const item of messages) {
        if (typeof item === 'string') {
          flattened.push(item);
        } else if (Array.isArray(item)) {
          // Recursively flatten nested arrays
          flattened.push(...this.flattenMessages(item));
        } else if (item !== null && item !== undefined) {
          // Convert other types to string
          flattened.push(String(item));
        }
      }
      return flattened.length > 0 ? flattened : ['Unknown error'];
    }

    // For other types, convert to string
    return [String(messages)];
  }

  /**
   * Safely extract exception information without circular references
   */
  private sanitizeException(exception: unknown): any {
    if (!exception) {
      return null;
    }

    if (exception instanceof Error) {
      return {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      };
    }

    if (typeof exception === 'object') {
      try {
        // Try to extract safe properties
        const safeException: any = {};
        const obj = exception as any;

        if (obj.message) safeException.message = obj.message;
        if (obj.name) safeException.name = obj.name;
        if (obj.stack) safeException.stack = obj.stack;
        if (obj.status) safeException.status = obj.status;
        if (obj.statusCode) safeException.statusCode = obj.statusCode;

        return safeException;
      } catch (e) {
        return { type: typeof exception, stringified: String(exception) };
      }
    }

    return { type: typeof exception, value: exception };
  }
}