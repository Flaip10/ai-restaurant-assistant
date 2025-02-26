import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const serializedValue = JSON.stringify(value); // Convert object to string
    await this.redisClient.set(key, serializedValue, 'EX', ttl);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    return value ? (JSON.parse(value) as T) : null; // Parse JSON if value exists
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async scanAndDelete(pattern: string): Promise<void> {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    } while (cursor !== '0');
  }

  async clearReservationCache(): Promise<void> {
    await this.scanAndDelete('reservations:*');
    await this.scanAndDelete('availability:*');
  }
}
