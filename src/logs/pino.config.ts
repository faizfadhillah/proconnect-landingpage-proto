import { Params } from 'nestjs-pino';
import { pino, stdSerializers, multistream } from 'pino';
import * as path from 'path';

// Logs directory
export const logDir = path.join(process.cwd(), 'logs');

// Configure Pino for HTTP requests (nestjs-pino)
export const pinoConfig: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined // No pretty print in production
        : {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        headers: {
          'content-type': req.headers['content-type'],
          'user-agent': req.headers['user-agent'],
          authorization: req.headers.authorization ? '***' : undefined,
        },
        ip: req.ip,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
      err: stdSerializers.err,
    },
    customProps: (req) => ({
      context: 'HTTP',
    }),
    // Disable auto request/response logging since we have LoggingInterceptor
    // LoggingInterceptor handles request/response logging with custom format
    autoLogging: false,
  },
};

// Custom Pino instance for file rotation with size limit using pino-roll
// This will be used in LoggingService
export function createPinoLogger() {
  // Console stream - use pino-pretty for development, raw JSON for production
  let consoleStream: NodeJS.WritableStream = process.stdout;
  
  if (process.env.NODE_ENV !== 'production') {
    try {
      // Use pino-pretty transport for pretty console output in development
      const pinoPretty = require('pino-pretty');
      consoleStream = pinoPretty({
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      });
    } catch {
      // Fallback to stdout if pino-pretty is not available
      consoleStream = process.stdout;
    }
  }

  // App log transport with pino-roll (5MB per file, max 5 files)
  // Using dynamic import to avoid TypeScript errors
  const createTransport = (filePath: string) => {
    return (pino as any).transport({
      target: 'pino-roll',
      options: {
        file: filePath,
        size: '5m', // 5MB per file
        limit: { count: 5 }, // Max 5 files (excluding active file)
        mkdir: true, // Create directory if not exists
      },
    });
  };

  const appLogTransport = createTransport(path.join(logDir, 'app.log'));
  const errorLogTransport = createTransport(path.join(logDir, 'error.log'));

  const logger = pino(
    {
      level: process.env.LOG_LEVEL || 'info',
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    multistream([
      // Console output (all levels) - use trace to catch all levels
      { level: 'trace', stream: consoleStream },
      // File output - app.log (info, warn)
      { level: 'info', stream: appLogTransport },
      { level: 'warn', stream: appLogTransport },
      // File output - error.log (error, fatal)
      { level: 'error', stream: errorLogTransport },
      { level: 'fatal', stream: errorLogTransport },
    ]),
  );

  return logger;
}

