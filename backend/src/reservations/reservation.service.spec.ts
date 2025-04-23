import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationRepo: jest.Mocked<Repository<Reservation>>;
  let customerRepo: jest.Mocked<Repository<Customer>>;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;

  const mockReservation = {
    id: 1,
    date: '2023-12-25',
    time: '19:00',
    guests: 2,
    customer: {
      id: 1,
      name: 'John Doe',
      reservations: [],
    },
  } as Reservation;

  const mockCustomer = {
    id: 1,
    name: 'John Doe',
    reservations: [],
  } as Customer;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getCount: jest.fn(),
  };

  beforeEach(async () => {
    configService = {
      get: jest
        .fn()
        .mockImplementation((key: string, defaultValue: unknown) => {
          const config: Record<string, number> = {
            TOTAL_SEATS: 10,
            SLOT_DURATION: 30,
            RESERVATION_DURATION: 60,
          };
          return config[key] || defaultValue;
        }),
    } as unknown as jest.Mocked<ConfigService>;

    reservationRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as unknown as jest.Mocked<Repository<Reservation>>;

    customerRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Customer>>;

    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      clearReservationCache: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: reservationRepo,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: customerRepo,
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('getReservations', () => {
    beforeEach(() => {
      mockQueryBuilder.getMany.mockResolvedValue([mockReservation]);
      mockQueryBuilder.getCount.mockResolvedValue(1);
    });

    it('should return cached reservations if available', async () => {
      const cachedData = {
        items: [mockReservation],
        listInfo: { totalItems: 1 },
      };
      redisService.get.mockResolvedValue(cachedData);

      const result = await service.getReservations();

      expect(redisService.get).toHaveBeenCalled();
      expect(result).toEqual(cachedData);
      expect(reservationRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should fetch reservations from database if no cache exists', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.getReservations();

      expect(redisService.get).toHaveBeenCalled();
      expect(reservationRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual({
        items: [mockReservation],
        listInfo: { totalItems: 1 },
      });
    });

    it('should handle database errors gracefully', async () => {
      redisService.get.mockResolvedValue(null);
      mockQueryBuilder.getMany.mockRejectedValue(new Error('DB Error'));

      await expect(service.getReservations()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('checkAvailability', () => {
    const mockInput: CheckAvailabilityInput = {
      date: '2025-05-01',
      time: '18:00',
      guests: 4,
    };

    it('should return cached availability if available', async () => {
      const cachedResult = {
        message: 'Time slot available',
        availableSlots: ['18:00'],
      };
      redisService.get.mockResolvedValue(cachedResult);

      const result = await service.checkAvailability(mockInput);

      expect(redisService.get).toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
      expect(reservationRepo.find).not.toHaveBeenCalled();
    });

    it('should check database for availability if no cache exists', async () => {
      redisService.get.mockResolvedValue(null);
      reservationRepo.find.mockResolvedValue([]);

      const result = await service.checkAvailability(mockInput);

      expect(redisService.get).toHaveBeenCalled();
      expect(reservationRepo.find).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
      expect(result.message).toBe('Time slot available');
      expect(result.availableSlots).toContain('18:00');
    });

    it('should handle time range availability check', async () => {
      const rangeInput: CheckAvailabilityInput = {
        date: '2025-05-01',
        timeRange: { start: '18:00', end: '20:00' },
        guests: 4,
      };
      redisService.get.mockResolvedValue(null);

      // Mock existing reservations that leave multiple slots available
      const existingReservations = [
        {
          ...mockReservation,
          time: '17:30', // Before our range
          guests: 2,
        },
        {
          ...mockReservation,
          time: '20:30', // After our range
          guests: 2,
        },
      ];
      reservationRepo.find.mockResolvedValue(existingReservations);

      const result = await service.checkAvailability(rangeInput);

      expect(result.message).toBe('Available slots within range');
      expect(result.availableSlots).toBeDefined();
      expect(result.availableSlots?.length).toBeGreaterThan(1);
      expect(result.availableSlots).toEqual(
        expect.arrayContaining(['18:00', '18:30', '19:00', '19:30']),
      );
    });
  });

  describe('createReservation', () => {
    const mockInput: CreateReservationInput = {
      date: '2025-05-01',
      time: '18:00',
      guests: 4,
      customerName: 'John Doe',
    };

    beforeEach(() => {
      customerRepo.findOne.mockResolvedValue(mockCustomer);
      reservationRepo.create.mockReturnValue(mockReservation);
      reservationRepo.save.mockResolvedValue(mockReservation);
      redisService.get.mockResolvedValue(null);
      reservationRepo.find.mockResolvedValue([]);
    });

    it('should create a new reservation successfully', async () => {
      const result = await service.createReservation(mockInput);

      expect(result.message).toContain('successfully created');
      expect(result.reservation).toBeDefined();
      expect(redisService.clearReservationCache).toHaveBeenCalled();
    });

    it('should return alternative slots when requested time is unavailable', async () => {
      const existingReservations = Array(10).fill({
        ...mockReservation,
        time: '18:00',
        guests: 1,
      });
      reservationRepo.find.mockResolvedValue(existingReservations);

      const result = await service.createReservation(mockInput);

      expect(result.message).toContain('Requested time is unavailable');
      expect(result.availableSlots).toBeDefined();
      expect(result.availableSlots?.length).toBeGreaterThan(0);
    });
  });

  describe('cancelReservation', () => {
    const reservationId = 1;

    it('should cancel reservation successfully', async () => {
      const deleteResult = { raw: [], affected: 1 };
      reservationRepo.delete.mockResolvedValue(deleteResult);

      const result = await service.cancelReservation(reservationId);

      expect(result).toBe(true);
      expect(redisService.clearReservationCache).toHaveBeenCalled();
    });

    it('should throw error if reservation not found', async () => {
      const deleteResult = { raw: [], affected: 0 };
      reservationRepo.delete.mockResolvedValue(deleteResult);

      await expect(service.cancelReservation(reservationId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateReservation', () => {
    const mockUpdate: UpdateReservationInput = {
      id: 1,
      date: '2025-05-01',
      time: '19:00',
      guests: 5,
    };

    beforeEach(() => {
      reservationRepo.findOne.mockResolvedValue(mockReservation);
      redisService.get.mockResolvedValue(null);
      reservationRepo.find.mockResolvedValue([]);
      reservationRepo.save.mockImplementation((entity) =>
        Promise.resolve({
          ...mockReservation,
          ...(entity as Partial<Reservation>),
        }),
      );
    });

    it('should update reservation successfully', async () => {
      const result = await service.updateReservation(mockUpdate);

      expect(result).toBeDefined();
      expect(result.time).toBe(mockUpdate.time);
      expect(redisService.clearReservationCache).toHaveBeenCalled();
    });

    it('should throw error if reservation not found', async () => {
      reservationRepo.findOne.mockResolvedValue(null);

      await expect(service.updateReservation(mockUpdate)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should check availability before updating time slot', async () => {
      const existingReservations = Array(10).fill({
        ...mockReservation,
        id: 2,
        time: '19:00',
        guests: 1,
      });
      reservationRepo.find.mockResolvedValue(existingReservations);

      const result = await service.updateReservation(mockUpdate);

      expect(result).toBeDefined();
      expect(result.time).toBe(mockUpdate.time);
      expect(redisService.clearReservationCache).toHaveBeenCalled();
    });
  });
});
