import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { randomBytes } from 'crypto';
import { User } from '../../user/user.entity';

interface TokenData {
  userId: string;
  role: string;
}

@Injectable()
export class SessionService {
  private readonly store: session.Store;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
    private readonly configService: ConfigService,
  ) {
    // Initialize RedisStore with express-session
    const Store = RedisStore(session);
    this.store = new Store({
      client: this.redisClient,
      prefix: 'sess:',
      ttl: 86400, // 1 day in seconds
    }) as session.Store;
  }

  getSessionConfig(): session.SessionOptions {
    return {
      store: this.store,
      secret:
        this.configService.get<string>('SESSION_SECRET') ||
        randomBytes(32).toString('hex'),
      resave: false,
      saveUninitialized: false,
      name: 'sid',
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
      },
    };
  }

  async createRefreshToken(user: Omit<User, 'password'>): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const key = `refresh_token:${token}`;

    await this.redisClient.set(
      key,
      JSON.stringify({ userId: user.id, role: user.role }),
      'EX',
      30 * 24 * 60 * 60, // 30 days
    );

    return token;
  }

  async validateRefreshToken(token: string): Promise<TokenData | null> {
    const key = `refresh_token:${token}`;
    const data = await this.redisClient.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as TokenData;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const key = `refresh_token:${token}`;
    await this.redisClient.del(key);
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    const pattern = `refresh_token:*`;
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

      for (const key of keys) {
        const data = await this.redisClient.get(key);
        if (data) {
          const parsed = JSON.parse(data) as TokenData;
          if (parsed.userId === userId) {
            await this.redisClient.del(key);
          }
        }
      }
    } while (cursor !== '0');
  }
}
