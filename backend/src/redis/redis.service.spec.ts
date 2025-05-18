import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

type RedisConfig = {
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_TTL: number;
};

type RedisMockType = {
  get: jest.Mock<Promise<string | null>, [string]>;
  set: jest.Mock<Promise<'OK'>, [string, string, string, number]>;
  del: jest.Mock<Promise<number>, string[]>;
  scan: jest.Mock<
    Promise<[string, string[]]>,
    [string, string, string, string, number]
  >;
  quit: jest.Mock<Promise<'OK'>, []>;
};

/* ------------------------------------------------------------------ */
/* Mock helpers                                                       */
/* ------------------------------------------------------------------ */

function createRedisMock(): RedisMockType {
  return {
    get: jest.fn<Promise<string | null>, [string]>(),
    set: jest.fn<Promise<'OK'>, [string, string, string, number]>(),
    del: jest.fn<Promise<number>, string[]>(),
    scan: jest.fn<
      Promise<[string, string[]]>,
      [string, string, string, string, number]
    >(),
    quit: jest.fn<Promise<'OK'>, []>(),
  };
}

function createConfigMock(): jest.Mocked<Partial<ConfigService>> {
  const config: RedisConfig = {
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    REDIS_TTL: 3600,
  };

  return {
    get: jest.fn().mockImplementation((key: keyof RedisConfig) => config[key]),
  };
}

/* ------------------------------------------------------------------ */
/* Main describe block                                                */
/* ------------------------------------------------------------------ */

describe('RedisService', () => {
  let service: RedisService;
  let redisMock: RedisMockType;
  let configService: jest.Mocked<Partial<ConfigService>>;

  /* constants used in several tests */
  const mockData = {
    key: 'test:key',
    value: { foo: 'bar' },
    pattern: 'test:*',
    ttl: 3600,
  };

  /* ------------------------------------------------------------------ */
  /* Test setup                                                         */
  /* ------------------------------------------------------------------ */
  beforeEach(async () => {
    /* fresh mocks every test */
    redisMock = createRedisMock();
    configService = createConfigMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        { provide: ConfigService, useValue: configService },
        { provide: 'REDIS_CLIENT', useValue: redisMock },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  /* ------------------------------------------------------------------ */
  /* Basic existence                                                    */
  /* ------------------------------------------------------------------ */
  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ------------------------------------------------------------------ */
  /* get                                                               */
  /* ------------------------------------------------------------------ */
  describe('get', () => {
    it('should return parsed JSON data when key exists', async () => {
      const jsonData = JSON.stringify(mockData.value);
      redisMock.get.mockResolvedValue(jsonData);

      const result = await service.get(mockData.key);

      expect(result).toEqual(mockData.value);
      expect(redisMock.get).toHaveBeenCalledWith(mockData.key);
    });

    it('should return null when key does not exist', async () => {
      redisMock.get.mockResolvedValue(null);

      const result = await service.get(mockData.key);

      expect(result).toBeNull();
    });

    it('should handle invalid JSON data', async () => {
      redisMock.get.mockResolvedValue('not valid json');

      const result = await service.get(mockData.key);

      expect(result).toBeNull();
      expect(redisMock.get).toHaveBeenCalledWith(mockData.key);
    });
  });

  /* ------------------------------------------------------------------ */
  /* set                                                               */
  /* ------------------------------------------------------------------ */
  describe('set', () => {
    it('should store stringified data with TTL', async () => {
      redisMock.set.mockResolvedValue('OK');
      await service.set(mockData.key, mockData.value, mockData.ttl);

      expect(redisMock.set).toHaveBeenCalledWith(
        mockData.key,
        JSON.stringify(mockData.value),
        'EX',
        mockData.ttl,
      );
    });

    it('should use default TTL when not provided', async () => {
      redisMock.set.mockResolvedValue('OK');
      await service.set(mockData.key, mockData.value);

      expect(redisMock.set).toHaveBeenCalledWith(
        mockData.key,
        JSON.stringify(mockData.value),
        'EX',
        configService.get?.('REDIS_TTL'),
      );
    });
  });

  /* ------------------------------------------------------------------ */
  /* scanAndDelete                                                     */
  /* ------------------------------------------------------------------ */
  describe('scanAndDelete', () => {
    beforeEach(() => {
      redisMock.scan.mockReset();
      redisMock.del.mockReset();
    });

    it('should scan and delete matching keys', async () => {
      redisMock.scan
        .mockResolvedValueOnce(['0', ['key1', 'key2']])
        .mockResolvedValueOnce(['0', []]);
      redisMock.del.mockResolvedValue(2);

      await service.scanAndDelete(mockData.pattern);

      expect(redisMock.scan).toHaveBeenCalledWith(
        expect.any(String),
        'MATCH',
        mockData.pattern,
        'COUNT',
        100,
      );
      expect(redisMock.del).toHaveBeenCalledWith('key1', 'key2');
    });

    it('should handle empty results', async () => {
      redisMock.scan.mockResolvedValue(['0', []]);

      await service.scanAndDelete(mockData.pattern);

      expect(redisMock.scan).toHaveBeenCalledWith(
        expect.any(String),
        'MATCH',
        mockData.pattern,
        'COUNT',
        100,
      );
      expect(redisMock.del).not.toHaveBeenCalled();
    });
  });

  /* ------------------------------------------------------------------ */
  /* clearReservationCache                                             */
  /* ------------------------------------------------------------------ */
  describe('clearReservationCache', () => {
    it('should clear both reservation and availability caches', async () => {
      const scanAndDeleteSpy = jest
        .spyOn(service, 'scanAndDelete')
        .mockImplementation(async () => {});

      await service.clearReservationCache();

      expect(scanAndDeleteSpy).toHaveBeenCalledTimes(2);
      expect(scanAndDeleteSpy).toHaveBeenNthCalledWith(1, 'reservations:*');
      expect(scanAndDeleteSpy).toHaveBeenNthCalledWith(2, 'availability:*');
    });
  });
});
