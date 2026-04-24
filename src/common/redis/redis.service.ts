import { Injectable, Logger } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import type { Redis } from "ioredis";

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@InjectRedis() private readonly client: Redis) {
    // Set up error handlers on the client
    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    // Prevent unhandled error events
    this.client.on("error", (err: Error) => {
      // Error is already logged by the module, but we can handle it here if needed
      // Don't throw - just log to prevent unhandled error events
      if (!err.message.includes("MaxRetriesPerRequestError")) {
        this.logger.debug(`Redis client error: ${err.message}`);
      }
    });
  }

  getClient(): Redis {
    return this.client;
  }

  async ping(): Promise<string | null> {
    try {
      if (this.isConnected()) {
        return await this.client.ping();
      }
      return null;
    } catch (error) {
      this.logger.debug(
        `Redis ping failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  isConnected(): boolean {
    try {
      return this.client?.status === "ready";
    } catch {
      return false;
    }
  }

  /**
   * Gracefully close Redis connection
   * Uses quit() to wait for pending commands to complete
   */
  async close(): Promise<void> {
    try {
      if (
        this.client &&
        this.client.status !== "end" &&
        this.client.status !== "close"
      ) {
        await this.client.quit();
      }
    } catch (error) {
      this.logger.debug(
        `Redis close error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Forcefully disconnect Redis connection
   * Use disconnect() if you want to close immediately without waiting
   */
  async disconnect(): Promise<void> {
    try {
      if (
        this.client &&
        this.client.status !== "end" &&
        this.client.status !== "close"
      ) {
        this.client.disconnect();
      }
    } catch (error) {
      this.logger.debug(
        `Redis disconnect error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
