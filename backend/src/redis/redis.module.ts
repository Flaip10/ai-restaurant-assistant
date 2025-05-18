import { Module } from '@nestjs/common';
import {
  RedisModule as NestRedisModule,
  RedisModuleOptions,
  getRedisConnectionToken,
} from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

@Module({
  imports: [
    NestRedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): RedisModuleOptions => {
        const host = configService.get<string>('REDIS_HOST') || 'localhost';
        const port = configService.get<number>('REDIS_PORT') || 6379;
        return {
          type: 'single',
          url: `redis://${host}:${port}`,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (redisClient: Redis): Redis => redisClient,
      inject: [getRedisConnectionToken()],
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
