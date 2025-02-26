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

  async clearReservationCache(): Promise<void> {
    const reservationKeys = await this.redisClient.keys('reservations:*');
    const availabilityKeys = await this.redisClient.keys('availability:*');

    const allKeys = [...reservationKeys, ...availabilityKeys];

    if (allKeys.length > 0) {
      await this.redisClient.del(...allKeys);
    }
  }
}
