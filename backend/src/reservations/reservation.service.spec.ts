/* reservation.service.spec.ts */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ReservationService } from './reservation.service';
import { Reservation } from './reservation.entity';
import { Customer } from '../customers/customer.entity';
import { RedisService } from '../redis/redis.service';
import { CreateReservationInput } from './dto/create-reservation.input';
import { CheckAvailabilityInput } from './dto/check-availability.input';
import { UpdateReservationInput } from './dto/update-reservation.input';

/* ------------------------------------------------------------------ */
/* Mock helpers                                                       */
/* ------------------------------------------------------------------ */

function createRepoMock<T extends ObjectLiteral>(): jest.Mocked<
  Partial<Repository<T>>
> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
}

/* Create a reusable mocked query‑builder */
const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getCount: jest.fn(),
} as unknown as jest.Mocked<SelectQueryBuilder<Reservation>>;

/* ------------------------------------------------------------------ */
/* Main describe block                                                */
/* ------------------------------------------------------------------ */

describe('ReservationService', () => {
  let service: ReservationService;

  /* typed mocks */
  let reservationRepo: jest.Mocked<Repository<Reservation>>;
  let customerRepo: jest.Mocked<Repository<Customer>>;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;

  /* constants used in several tests */
  const mockReservation: Reservation = {
    id: 1,
    date: '2023-12-25',
    time: '19:00',
    guests: 2,
    customer: { id: 1, name: 'John Doe', reservations: [] } as Customer,
  } as Reservation;

  const mockCustomer: Customer = {
    id: 1,
    name: 'John Doe',
    reservations: [],
  } as Customer;

  /* ------------------------------------------------------------------ */
  /* Test setup                                                         */
  /* ------------------------------------------------------------------ */
  beforeEach(async () => {
    /* fresh mocks every test */
    reservationRepo = createRepoMock<Reservation>() as jest.Mocked<
      Repository<Reservation>
    >;
    customerRepo = createRepoMock<Customer>() as jest.Mocked<
      Repository<Customer>
    >;

    /* wire the custom query‑builder to createQueryBuilder */
    reservationRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      clearReservationCache: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    /* minimal configService that returns numbers */
    configService = {
      get: jest.fn().mockImplementation((key: string, def: unknown) => {
        const cfg: Record<string, number> = {
          TOTAL_SEATS: 10,
          SLOT_DURATION: 30,
          RESERVATION_DURATION: 60,
        };
        return cfg[key] ?? def;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: getRepositoryToken(Reservation), useValue: reservationRepo },
        { provide: getRepositoryToken(Customer), useValue: customerRepo },
        { provide: RedisService, useValue: redisService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(ReservationService);
  });

  /* ------------------------------------------------------------------ */
  /* Basic existence                                                    */
  /* ------------------------------------------------------------------ */
  it('service should be defined', () => expect(service).toBeDefined());

  /* ------------------------------------------------------------------ */
  /* getReservations                                                    */
  /* ------------------------------------------------------------------ */
  describe('getReservations', () => {
    beforeEach(() => {
      mockQueryBuilder.getMany.mockReset();
      mockQueryBuilder.getCount.mockReset();

      mockQueryBuilder.getMany.mockResolvedValue([mockReservation]);
      mockQueryBuilder.getCount.mockResolvedValue(1);
    });

    it('returns cached reservations when present', async () => {
      const cached = { items: [mockReservation], listInfo: { totalItems: 1 } };
      redisService.get.mockResolvedValue(cached);

      const result = await service.getReservations();

      expect(redisService.get).toHaveBeenCalled();
      expect(reservationRepo.createQueryBuilder).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });

    it('falls back to DB when cache miss', async () => {
      redisService.get.mockResolvedValue(null);

      const sort = { sortBy: 'date', order: 'ASC' } as const;
      const result = await service.getReservations(undefined, undefined, sort);

      expect(redisService.get).toHaveBeenCalled();
      expect(reservationRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual({
        items: [mockReservation],
        listInfo: { totalItems: 1 },
      });
    });

    it('throws InternalServerErrorException on DB error', async () => {
      redisService.get.mockResolvedValue(null);
      mockQueryBuilder.getMany.mockRejectedValue(new Error('db fail'));

      await expect(service.getReservations()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  /* ------------------------------------------------------------------ */
  /* checkAvailability                                                  */
  /* ------------------------------------------------------------------ */
  describe('checkAvailability', () => {
    const baseInput: CheckAvailabilityInput = {
      date: '2025-05-01',
      time: '18:00',
      guests: 4,
    };

    it('returns cached result when present', async () => {
      const cached = {
        message: 'Cached slot',
        availableSlots: ['18:00'],
      };
      redisService.get.mockResolvedValue(cached);

      const result = await service.checkAvailability(baseInput);

      expect(redisService.get).toHaveBeenCalled();
      expect(reservationRepo.find).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });

    it('checks DB + caches when no cached result', async () => {
      redisService.get.mockResolvedValue(null);
      reservationRepo.find.mockResolvedValue([]); // no clashes

      const result = await service.checkAvailability(baseInput);

      expect(reservationRepo.find).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
      expect(result.message).toBe('Time slot available');
    });

    it('handles time‑range availability', async () => {
      const rangeInput: CheckAvailabilityInput = {
        date: '2025-05-01',
        timeRange: { start: '18:00', end: '20:00' },
        guests: 4,
      };
      redisService.get.mockResolvedValue(null);

      const existing = [
        { ...mockReservation, time: '17:30' },
        { ...mockReservation, time: '20:30' },
      ];
      reservationRepo.find.mockResolvedValue(existing);

      const result = await service.checkAvailability(rangeInput);

      expect(result.message).toBe('Available slots within range');
      expect(result.availableSlots).toEqual(
        expect.arrayContaining(['18:00', '18:30', '19:00', '19:30']),
      );
    });
  });

  /* ------------------------------------------------------------------ */
  /* createReservation                                                  */
  /* ------------------------------------------------------------------ */
  describe('createReservation', () => {
    const input: CreateReservationInput = {
      date: '2025-05-01',
      time: '18:00',
      guests: 4,
      customerName: 'John Doe',
    };

    beforeEach(() => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      reservationRepo.find.mockResolvedValue([]);
      reservationRepo.create.mockReturnValue(mockReservation);
      reservationRepo.save.mockResolvedValue(mockReservation);
    });

    it('creates a reservation when slot free', async () => {
      const result = await service.createReservation(input);

      expect(result.message).toContain('successfully created');
      expect(redisService.clearReservationCache).toHaveBeenCalled();
    });

    it('suggests alternatives when slot full', async () => {
      const full = Array(10).fill({
        ...mockReservation,
        time: '18:00',
        guests: 1,
      });
      reservationRepo.find.mockResolvedValue(full);

      const result = await service.createReservation(input);

      expect(result.message).toContain('Requested time is unavailable');
      expect(result.availableSlots?.length).toBeGreaterThan(0);
    });
  });

  /* ------------------------------------------------------------------ */
  /* cancelReservation                                                  */
  /* ------------------------------------------------------------------ */
  describe('cancelReservation', () => {
    it('returns true when deletion affected 1 row', async () => {
      reservationRepo.delete.mockResolvedValue({ raw: [], affected: 1 });

      const ok = await service.cancelReservation(1);

      expect(ok).toBe(true);
      expect(redisService.clearReservationCache).toHaveBeenCalled();
    });

    it('throws when nothing deleted', async () => {
      reservationRepo.delete.mockResolvedValue({ raw: [], affected: 0 });

      await expect(service.cancelReservation(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  /* ------------------------------------------------------------------ */
  /* updateReservation                                                  */
  /* ------------------------------------------------------------------ */
  describe('updateReservation', () => {
    const update: UpdateReservationInput = {
      id: 1,
      date: '2025-05-01',
      time: '19:00',
      guests: 5,
    };

    beforeEach(() => {
      reservationRepo.findOne.mockResolvedValue(mockReservation);
      reservationRepo.find.mockResolvedValue([]);
      reservationRepo.save.mockImplementation((e) =>
        Promise.resolve({ ...mockReservation, ...(e as Reservation) }),
      );
      redisService.get.mockResolvedValue(null);
    });

    it('updates successfully', async () => {
      const res = await service.updateReservation(update);

      expect(res.time).toBe(update.time);
      expect(redisService.clearReservationCache).toHaveBeenCalled();
    });

    it('throws NotFound when reservation missing', async () => {
      reservationRepo.findOne.mockResolvedValue(null);

      await expect(service.updateReservation(update)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('still updates if requested slot has capacity', async () => {
      reservationRepo.find.mockResolvedValue(
        Array(10).fill({ ...mockReservation, id: 2, time: '19:00', guests: 1 }),
      );

      const res = await service.updateReservation(update);

      expect(res.time).toBe(update.time);
    });
  });
});
