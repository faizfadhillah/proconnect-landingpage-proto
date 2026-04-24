import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggingService } from 'src/logs/logs.service';
import { BackendExceptionFilter } from './backend-exception.filter';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: LoggingService,
    private readonly exceptionFilter: BackendExceptionFilter,
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, body, query, params } = request;
    const startTime = Date.now();

    // Log all methods, but skip body for GET requests
    const isGet = method === 'GET';
    const requestLog: any = {
      method,
      url,
      query,
      params,
      headers: {
        'content-type': request.get('content-type'),
        'user-agent': request.get('user-agent'),
        'authorization': request.get('authorization') ? '***' : undefined,
      },
      ip: request.ip,
      timestamp: new Date().toISOString(),
    };

    // Only include body for non-GET requests
    if (!isGet && body) {
      requestLog.body = this.sanitizeBody(body);
    }

    this.logger.log(
      `[REQUEST] ${method} ${url} - ${JSON.stringify(requestLog)}`,
      'http-request',
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const responseLog = {
            method,
            url,
            statusCode: response.statusCode,
            response: this.sanitizeResponse(data),
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
          };

          this.logger.log(
            `[RESPONSE] ${method} ${url} - Status: ${response.statusCode} - Duration: ${duration}ms - Response: ${JSON.stringify(responseLog)}`,
            'http-response',
          );
        },
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // Generate error response using ExceptionFilter's method for consistency
        const { status: statusCode, errorResponse: responsePayload } = 
          this.exceptionFilter.generateErrorResponse(error, url);

        // Set response status code if not already set
        if (!response.headersSent) {
          response.status(statusCode);
        }

        const responseLog = {
          method,
          url,
          statusCode,
          response: this.sanitizeResponse(responsePayload),
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        };

        this.logger.error(
          `[RESPONSE] ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms - Response: ${JSON.stringify(responseLog)}`,
          'http-error',
        );

        // Re-throw the error so ExceptionFilter can handle it
        return throwError(() => error);
      }),
    );
  }

  /**
   * Sanitize request body to remove sensitive data or limit size
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];

    // Remove sensitive fields
    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    });

    // Limit size for large payloads
    const bodyString = JSON.stringify(sanitized);
    if (bodyString.length > 10000) {
      return {
        ...sanitized,
        _truncated: true,
        _originalSize: bodyString.length,
      };
    }

    return sanitized;
  }

  /**
   * Sanitize response data to limit size.
   * try/catch guards against circular refs or other non-serializable values.
   */
  private sanitizeResponse(data: any): any {
    if (!data) return data;

    try {
      const dataString = JSON.stringify(data);
      if (dataString.length > 10000) {
        return {
          _truncated: true,
          _originalSize: dataString.length,
          _preview: dataString.substring(0, 1000),
        };
      }
      return data;
    } catch {
      return '[Non-serializable value]';
    }
  }
}

