import { Injectable, INestApplication } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { RedisService } from '../common/redis/redis.service';
import { EMAIL_QUEUE_NAMES } from '../notifications/email/constants/constants';
import {
  EDUCATION_VERIFICATION_QUEUE,
  CERTIFICATE_VERIFICATION_QUEUE,
  INFORMAL_CERTIFICATE_PROCESSING_QUEUE,
  INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE,
  RETROACTIVE_EDUCATION_LICENSE_QUEUE,
  RETROACTIVE_LICENSE_SKILL_QUEUE,
} from '../common/queues/queue.constants';
import * as http from 'http';
import { LoggingService } from '../logs/logs.service';

/**
 * Service to handle graceful shutdown of the application
 * Manages signal handlers and connection cleanup
 */
@Injectable()
export class ShutdownService {
  private server!: http.Server;
  private app!: INestApplication;
  private isShuttingDown = false;

  constructor(
    private readonly redisService: RedisService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Setup shutdown handlers
   */
  setup(app: INestApplication): void {
    this.server = app.getHttpServer();
    this.app = app;
    this.setupSignalHandlers();
  }

  /**
   * Setup process signal handlers
   */
  private setupSignalHandlers(): void {
    // Handle SIGTERM (Kubernetes/Docker)
    process.on('SIGTERM', () => this.handleShutdown('SIGTERM'));

    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => this.handleShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.loggingService.error('Uncaught Exception', 'shutdown', error instanceof Error ? error.stack : undefined, { error: error instanceof Error ? error.message : String(error) });
      this.handleShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.loggingService.error('Unhandled Rejection', 'shutdown', undefined, { promise: String(promise), reason: reason instanceof Error ? reason.message : String(reason) });
      this.handleShutdown('unhandledRejection');
    });
  }

  /**
   * Main shutdown handler
   */
  private handleShutdown(signal: string): void {
    if (this.isShuttingDown) {
      this.loggingService.warn('Shutdown already in progress', 'shutdown');
      return;
    }
    this.isShuttingDown = true;

    this.loggingService.log(`${signal} received: starting graceful shutdown`, 'shutdown');

    // Close all connections and exit
    this.closeConnections()
      .then(() => {
        this.loggingService.log('All connections closed', 'shutdown');
        this.loggingService.log('Exiting...', 'shutdown');
        process.exit(0);
      })
      .catch((error) => {
        this.loggingService.error(`Shutdown error: ${error instanceof Error ? error.message : String(error)}`, 'shutdown', error instanceof Error ? error.stack : undefined);
        process.exit(1);
      });
  }

  /**
   * Orchestrate closing all connections
   */
  private async closeConnections(): Promise<void> {
    this.loggingService.log('Closing connections...', 'shutdown');

    await this.closeHttpServer();
    await this.closeBullQueue();
    this.disconnectRedis();
  }

  /**
   * Close HTTP server gracefully
   */
  private async closeHttpServer(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.server.close(() => {
        this.loggingService.log('HTTP server closed', 'shutdown');
        resolve();
      });
    });
  }

  /**
   * Close all Bull queues with timeout
   * Gets queues dynamically from app context (registered in feature modules)
   */
  private async closeBullQueue(): Promise<void> {
    try {
      this.loggingService.log('Closing all Bull queues...', 'shutdown');
      
      // Get queues dynamically from app context
      // Queues are registered in their respective feature modules
      const queueNames = [
        EMAIL_QUEUE_NAMES.SEND_EMAIL,
        EDUCATION_VERIFICATION_QUEUE,
        CERTIFICATE_VERIFICATION_QUEUE,
        INFORMAL_CERTIFICATE_PROCESSING_QUEUE,
        INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE,
        RETROACTIVE_EDUCATION_LICENSE_QUEUE,
        RETROACTIVE_LICENSE_SKILL_QUEUE,
      ];

      const queues: Queue[] = [];
      for (const queueName of queueNames) {
        try {
          const queue = this.app.get<Queue>(getQueueToken(queueName), { strict: false });
          if (queue) {
            queues.push(queue);
          }
        } catch (err) {
          // Queue might not be registered (e.g., in test environment)
          this.loggingService.debug(`Queue ${queueName} not found, skipping...`, 'shutdown');
        }
      }

      if (queues.length === 0) {
        this.loggingService.log('No Bull queues found to close', 'shutdown');
        return;
      }

      await Promise.race([
        Promise.all(queues.map(queue => queue.close())),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000),
        ),
      ]);
      this.loggingService.log(`All ${queues.length} Bull queues closed`, 'shutdown');
    } catch (err: any) {
      this.loggingService.warn(`Bull queues close timeout: ${err instanceof Error ? err.message : String(err)}`, 'shutdown');
    }
  }

  /**
   * Force disconnect Redis (immediate, no graceful close)
   */
  private disconnectRedis(): void {
    try {
      this.loggingService.log('Disconnecting Redis...', 'shutdown');
      this.redisService.disconnect(); // No await - immediate disconnect
      this.loggingService.log('Redis disconnected', 'shutdown');
    } catch (err: any) {
      this.loggingService.warn(`Redis disconnect error: ${err instanceof Error ? err.message : String(err)}`, 'shutdown');
    }
  }
}
