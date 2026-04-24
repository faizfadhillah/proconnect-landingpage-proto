import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import { LoggingService } from 'src/logs/logs.service';

@Injectable()
export class CacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: LoggingService,
  ) {}

  private getAdjustedKey(key: string): string {
    return `${process.env.REDIS_APP_NAME}:${key}`;
  }

  /**
   * Set a value in the cache with an optional TTL
   * @param proposedKey Cache key
   * @param value Value to cache (will be JSON serialized)
   * @param ttl Time to live in seconds (optional)
   * @returns Boolean indicating success
   */
  async set(proposedKey: string, value: any, ttl?: number): Promise<boolean> {
    const key = this.getAdjustedKey(proposedKey);
    try {
      const client = this.redisService.getClient();
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        // ioredis: set key value EX ttl
        await client.set(key, serializedValue, 'EX', ttl);
      } else {
        await client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Error setting key ${key}: ${error instanceof Error ? error.message : String(error)}`,
        'cache',
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  /**
   * Get a value from the cache
   * @param proposedKey Cache key
   * @returns The cached value or null if not found
   */
  async get(proposedKey: string): Promise<any> {
    const key = this.getAdjustedKey(proposedKey);
    try {
      const client = this.redisService.getClient();
      const value = await client.get(key);

      if (value === null) {
        return null;
      }

      try {
        return JSON.parse(value);
      } catch {
        // If parsing fails, return the raw string value
        return value;
      }
    } catch (error) {
      this.logger.error(
        `Error getting key ${key}: ${error instanceof Error ? error.message : String(error)}`,
        'cache',
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  /**
   * Delete a key from the cache
   * @param proposedKey Cache key
   * @returns Boolean indicating success
   */
  async del(proposedKey: string): Promise<boolean> {
    const key = this.getAdjustedKey(proposedKey);
    try {
      const client = this.redisService.getClient();
      const result = await client.del(key);
      return result > 0;
    } catch (error) {
      this.logger.error(
        `Error deleting key ${key}: ${error instanceof Error ? error.message : String(error)}`,
        'cache',
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  /**
   * Check if a key exists in the cache
   * @param proposedKey Cache key
   * @returns Boolean indicating existence
   */
  async exists(proposedKey: string): Promise<boolean> {
    const key = this.getAdjustedKey(proposedKey);
    try {
      const client = this.redisService.getClient();
      const result = await client.exists(key);
      return result > 0;
    } catch (error) {
      this.logger.error(
        `Error checking existence of key ${key}: ${error instanceof Error ? error.message : String(error)}`,
        'cache',
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  /**
   * Increment a numeric value in the cache
   * @param proposedKey Cache key
   * @param by Amount to increment by (default: 1)
   * @returns The new value after incrementing
   */
  async increment(proposedKey: string, by: number = 1): Promise<number> {
    const key = this.getAdjustedKey(proposedKey);
    try {
      const client = this.redisService.getClient();
      if (by === 1) {
        return await client.incr(key);
      } else {
        return await client.incrby(key, by);
      }
    } catch (error) {
      this.logger.error(
        `Error incrementing key ${key}: ${error instanceof Error ? error.message : String(error)}`,
        'cache',
        error instanceof Error ? error.stack : undefined,
      );
      return 0;
    }
  }

  /**
   * Decrement a numeric value in the cache
   * @param proposedKey Cache key
   * @param by Amount to decrement by (default: 1)
   * @returns The new value after decrementing
   */
  async decrement(proposedKey: string, by: number = 1): Promise<number> {
    const key = this.getAdjustedKey(proposedKey);
    try {
      const client = this.redisService.getClient();
      if (by === 1) {
        return await client.decr(key);
      } else {
        return await client.decrby(key, by);
      }
    } catch (error) {
      this.logger.error(
        `Error decrementing key ${key}: ${error instanceof Error ? error.message : String(error)}`,
        'cache',
        error instanceof Error ? error.stack : undefined,
      );
      return 0;
    }
  }

  /**
   * Set a TTL (time to live) for a key
   * @param proposedKey Cache key
   * @param ttl Time to live in seconds
   * @returns Boolean indicating success
   */
  async expire(proposedKey: string, ttl: number): Promise<boolean> {
    const key = this.getAdjustedKey(proposedKey);
    try {
      const client = this.redisService.getClient();
      const result = await client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Error setting TTL for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
        'cache',
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  /**
   * Get the TTL (time to live) for a key
   * @param proposedKey Cache key
   * @returns TTL in seconds, -1 if no expiry, -2 if key doesn't exist
   */
  async ttl(proposedKey: string): Promise<number> {
    const key = this.getAdjustedKey(proposedKey);
    try {
      const client = this.redisService.getClient();
      return await client.ttl(key);
    } catch (error) {
      this.logger.error(
        `Error getting TTL for key ${key}: ${error instanceof Error ? error.message : String(error)}`,
        'cache',
        error instanceof Error ? error.stack : undefined,
      );
      return -2;
    }
  }

  /**
   * Get multiple values from the cache
   * @param keys Array of cache keys
   * @returns Array of values in the same order as keys
   */
  async mget(proposedKeys: string[]): Promise<any[]> {
    const keys = proposedKeys.map((key) => this.getAdjustedKey(key));
    try {
      const client = this.redisService.getClient();
      const values = await client.mget(...keys);
      return values.map((value) => {
        if (value === null) return null;
        try {
          return JSON.parse(value);
        } catch {
          // If parsing fails, return the raw string value
          return value;
        }
      });
    } catch (error) {
      this.logger.error(
        `Error getting multiple keys: ${error instanceof Error ? error.message : String(error)}`,
        'cache',
        error instanceof Error ? error.stack : undefined,
      );
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple key-value pairs in the cache
   * @param keyValuePairs Object with key-value pairs
   * @param ttl Time to live in seconds (optional)
   * @returns Boolean indicating success
   */
  async mset(
    proposedKeyValuePairs: Record<string, any>,
    ttl?: number,
  ): Promise<boolean> {
    const keyValuePairs = Object.fromEntries(
      Object.entries(proposedKeyValuePairs).map(([key, value]) => [
        this.getAdjustedKey(key),
        value,
      ]),
    );
    try {
      const client = this.redisService.getClient();
      // Convert values to JSON strings
      const pairsArray: string[] = [];
      for (const [key, value] of Object.entries(keyValuePairs)) {
        pairsArray.push(key, JSON.stringify(value));
      }
      await client.mset(...pairsArray);
      // Set TTL for all keys if specified
      if (ttl) {
        const keys = Object.keys(keyValuePairs);
        const promises = keys.map((key) => client.expire(key, ttl));
        await Promise.all(promises);
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Error setting multiple keys: ${error instanceof Error ? error.message : String(error)}`,
        'cache',
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }
}
