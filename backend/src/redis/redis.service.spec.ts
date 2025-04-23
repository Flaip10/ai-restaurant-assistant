import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

// Create a mock for the Redis client
const mockRedisClient = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  scan: jest.fn(),
};

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set', () => {
    it('should set a value in Redis with expiration', async () => {
      const key = 'test-key';
      const value = { name: 'test-value' };
      const ttl = 3600;

      await service.set(key, value, ttl);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        'EX',
        ttl,
      );
    });

    it('should use default TTL if not provided', async () => {
      const key = 'test-key';
      const value = { name: 'test-value' };

      await service.set(key, value);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        key,
        JSON.stringify(value),
        'EX',
        3600, // Default TTL
      );
    });
  });

  describe('get', () => {
    it('should get and parse a value from Redis', async () => {
      const key = 'test-key';
      const value = { name: 'test-value' };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(value));

      const result = await service.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    it('should return null if key does not exist', async () => {
      const key = 'non-existent-key';

      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get(key);

      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete a key from Redis', async () => {
      const key = 'test-key';

      await service.del(key);

      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });
  });

  describe('scanAndDelete', () => {
    it('should scan and delete keys matching a pattern', async () => {
      const pattern = 'test-*';

      // Mock first scan returning some keys and cursor 42
      mockRedisClient.scan.mockResolvedValueOnce(['42', ['test-1', 'test-2']]);
      // Mock second scan returning more keys and cursor 0 (end)
      mockRedisClient.scan.mockResolvedValueOnce(['0', ['test-3']]);

      await service.scanAndDelete(pattern);

      // Should have called scan twice with the correct pattern
      expect(mockRedisClient.scan).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.scan).toHaveBeenNthCalledWith(
        1,
        '0',
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      expect(mockRedisClient.scan).toHaveBeenNthCalledWith(
        2,
        '42',
        'MATCH',
        pattern,
        'COUNT',
        100,
      );

      // Should have called del with the keys from both scans
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.del).toHaveBeenNthCalledWith(
        1,
        'test-1',
        'test-2',
      );
      expect(mockRedisClient.del).toHaveBeenNthCalledWith(2, 'test-3');
    });

    it('should not call del if no keys are found', async () => {
      const pattern = 'test-*';

      // Mock scan returning no keys
      mockRedisClient.scan.mockResolvedValueOnce(['0', []]);

      await service.scanAndDelete(pattern);

      expect(mockRedisClient.scan).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('clearReservationCache', () => {
    it('should clear both reservation and availability caches', async () => {
      // Mock implementation of scanAndDelete
      jest.spyOn(service, 'scanAndDelete').mockImplementation(async () => {});

      await service.clearReservationCache();

      expect(service.scanAndDelete).toHaveBeenCalledTimes(2);
      expect(service.scanAndDelete).toHaveBeenNthCalledWith(
        1,
        'reservations:*',
      );
      expect(service.scanAndDelete).toHaveBeenNthCalledWith(
        2,
        'availability:*',
      );
    });
  });
});
