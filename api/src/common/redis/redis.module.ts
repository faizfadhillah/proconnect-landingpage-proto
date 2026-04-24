import { Module, Global, Logger } from "@nestjs/common";
import { RedisModule as NestjsRedisModule } from "@nestjs-modules/ioredis";
import { RedisService } from "./redis.service";
import { CacheService } from "./cache.service";
import { LogsModule } from "src/logs/logs.module";

const logger = new Logger("RedisModule");

@Global()
@Module({
  imports: [
    LogsModule,
    NestjsRedisModule.forRootAsync({
      useFactory: () => {
        const redisOptions = {
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379", 10),
          db: parseInt(process.env.REDIS_DB || "0", 10),
          password: process.env.REDIS_PASSWORD,
          // Retry configuration to prevent MaxRetriesPerRequestError
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            if (times > 10) {
              logger.error(`Redis connection failed after ${times} retries`);
              return null; // Stop retrying after 10 attempts
            }
            return delay;
          },
          // Don't queue commands when Redis is offline
          enableOfflineQueue: false,
          // Connection timeout
          connectTimeout: 10000,
          // Connect immediately on startup so health check in AppModule works reliably
          lazyConnect: false,
        };

        return {
          type: "single",
          options: redisOptions,
          onClientReady: (client: any) => {
            // Handle connection events
            client.on("connect", () => {
              logger.log("Redis client connecting...");
            });

            client.on("ready", () => {
              logger.log("Redis client ready");
            });

            client.on("error", (err: Error) => {
              logger.error(`Redis client error: ${err.message}`, err.stack);
            });

            client.on("close", () => {
              logger.warn("Redis client connection closed");
            });

            client.on("reconnecting", (delay: number) => {
              logger.warn(`Redis client reconnecting in ${delay}ms...`);
            });

            client.on("end", () => {
              logger.warn("Redis client connection ended");
            });
          },
        };
      },
    }),
  ],
  providers: [RedisService, CacheService],
  exports: [RedisService, CacheService],
})
export class RedisModule {}
