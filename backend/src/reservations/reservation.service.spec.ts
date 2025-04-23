import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ReservationService } from './reservation.service';
import { Reservation } from './reservation.entity';
import { Customer } from '../customers/customer.entity';
import { RedisService } from '../redis/redis.service';
import { CreateReservationInput } from './dto/create-reservation.input';
import { CheckAvailabilityInput } from './dto/check-availability.input';
import { UpdateReservationInput } from './dto/update-reservation.input';

// Mock repositories and services
const mockReservationRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getCount: jest.fn(),
  })),
};

const mockCustomerRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  clearReservationCache: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key, defaultValue) => {
    const config = {
      TOTAL_SEATS: 10,
      SLOT_DURATION: 30,
      RESERVATION_DURATION: 60,
    };
    return config[key] || defaultValue;
  }),
};

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationRepo: Repository<Reservation>;
  let customerRepo: Repository<Customer>;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationService,
        {
          provide: getRepositoryToken(Reservation),
          useValue: mockReservationRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ReservationService>(ReservationService);
    reservationRepo = module.get<Repository<Reservation>>(
      getRepositoryToken(Reservation),
    );
    customerRepo = module.get<Repository<Customer>>(
      getRepositoryToken(Customer),
    );
    redisService = module.get<RedisService>(RedisService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getReservations', () => {
    it('should return cached reservations if available', async () => {
      const cachedData = {
        items: [{ id: 1, date: '2025-05-01', time: '18:00', guests: 4 }],
        listInfo: { totalItems: 1 },
      };

      (redisService.get as jest.Mock).mockResolvedValue(cachedData);

      const result = await service.getReservations();

      expect(redisService.get).toHaveBeenCalled();
      expect(result).toEqual(cachedData);
      expect(reservationRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should query database and cache results if no cache exists', async () => {
      const reservations = [
        { id: 1, date: '2025-05-01', time: '18:00', guests: 4 },
      ];
      const totalItems = 1;

      (redisService.get as jest.Mock).mockResolvedValue(null);
      const queryBuilder = reservationRepo.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue(reservations);
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(totalItems);

      const result = await service.getReservations();

      expect(redisService.get).toHaveBeenCalled();
      expect(reservationRepo.createQueryBuilder).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
      expect(result).toEqual({
        items: reservations,
        listInfo: { totalItems },
      });
    });

    it('should apply filters when provided', async () => {
      const filter = { date: '2025-05-01', guests: 4 };

      (redisService.get as jest.Mock).mockResolvedValue(null);
      const queryBuilder = reservationRepo.createQueryBuilder();
      (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(0);

      await service.getReservations(filter);

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });
  });

  describe('checkAvailability', () => {
    it('should return cached availability if available', async () => {
      const input: CheckAvailabilityInput = {
        date: '2025-05-01',
        time: '18:00',
        guests: 4,
      };

      const cachedResult = {
        message: 'Time slot available',
        availableSlots: ['18:00'],
      };

      redisService.get.mockResolvedValue(cachedResult);

      const result = await service.checkAvailability(input);

      expect(redisService.get).toHaveBeenCalled();
      expect(result).toEqual(cachedResult);
      expect(reservationRepo.find).not.toHaveBeenCalled();
    });

    it('should check specific time slot availability', async () => {
      const input: CheckAvailabilityInput = {
        date: '2025-05-01',
        time: '18:00',
        guests: 2,
      };

      const existingReservations = [
        { id: 1, date: '2025-05-01', time: '18:00', guests: 4 },
      ];

      redisService.get.mockResolvedValue(null);
      reservationRepo.find.mockResolvedValue(existingReservations);

      const result = await service.checkAvailability(input);

      expect(redisService.get).toHaveBeenCalled();
      expect(reservationRepo.find).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
      expect(result.message).toContain('Time slot available');
      expect(result.availableSlots).toContain('18:00');
    });

    it('should check time range availability', async () => {
      const input: CheckAvailabilityInput = {
        date: '2025-05-01',
        timeRange: { start: '18:00', end: '20:00' },
        guests: 2,
      };

      const existingReservations = [
        { id: 1, date: '2025-05-01', time: '18:00', guests: 8 },
        { id: 2, date: '2025-05-01', time: '19:00', guests: 2 },
      ];

      redisService.get.mockResolvedValue(null);
      reservationRepo.find.mockResolvedValue(existingReservations);

      const result = await service.checkAvailability(input);

      expect(redisService.get).toHaveBeenCalled();
      expect(reservationRepo.find).toHaveBeenCalled();
      expect(redisService.set).toHaveBeenCalled();
      expect(result.message).toContain('Available slots within range');
      expect(result.availableSlots.length).toBeGreaterThan(0);
    });
  });

  describe('createReservation', () => {
    it('should create a reservation with existing customer', async () => {
      const input: CreateReservationInput = {
        customerName: 'John Doe',
        date: '2025-05-01',
        time: '18:00',
        guests: 2,
      };

      const customer = { id: 1, name: 'John Doe' };
      const existingReservations = [];
      const newReservation = { ...input, id: 1, customer };

      customerRepo.findOne.mockResolvedValue(customer);
      reservationRepo.find.mockResolvedValue(existingReservations);
      reservationRepo.create.mockReturnValue(newReservation);
      reservationRepo.save.mockResolvedValue(newReservation);

      const result = await service.createReservation(input);

      expect(customerRepo.findOne).toHaveBeenCalled();
      expect(customerRepo.create).not.toHaveBeenCalled();
      expect(reservationRepo.find).toHaveBeenCalled();
      expect(reservationRepo.create).toHaveBeenCalled();
      expect(reservationRepo.save).toHaveBeenCalled();
      expect(redisService.clearReservationCache).toHaveBeenCalled();
      expect(result.message).toContain('successfully created');
      expect(result.reservation).toEqual(newReservation);
    });

    it('should create a new customer if one does not exist', async () => {
      const input: CreateReservationInput = {
        customerName: 'New Customer',
        date: '2025-05-01',
        time: '18:00',
        guests: 2,
      };

      const customer = { id: 1, name: 'New Customer' };
      const existingReservations = [];
      const newReservation = { ...input, id: 1, customer };

      customerRepo.findOne.mockResolvedValue(null);
      customerRepo.create.mockReturnValue(customer);
      customerRepo.save.mockResolvedValue(customer);
      reservationRepo.find.mockResolvedValue(existingReservations);
      reservationRepo.create.mockReturnValue(newReservation);
      reservationRepo.save.mockResolvedValue(newReservation);

      const result = await service.createReservation(input);

      expect(customerRepo.findOne).toHaveBeenCalled();
      expect(customerRepo.create).toHaveBeenCalled();
      expect(customerRepo.save).toHaveBeenCalled();
      expect(reservationRepo.find).toHaveBeenCalled();
      expect(reservationRepo.create).toHaveBeenCalled();
      expect(reservationRepo.save).toHaveBeenCalled();
      expect(redisService.clearReservationCache).toHaveBeenCalled();
      expect(result.message).toContain('successfully created');
      expect(result.reservation).toEqual(newReservation);
    });

    it('should suggest alternative slots if requested time is unavailable', async () => {
      const input: CreateReservationInput = {
        customerName: 'John Doe',
        date: '2025-05-01',
        time: '18:00',
        guests: 6,
      };

      const customer = { id: 1, name: 'John Doe' };
      const existingReservations = [
        { id: 1, date: '2025-05-01', time: '18:00', guests: 6 },
      ];

      customerRepo.findOne.mockResolvedValue(customer);
      reservationRepo.find.mockResolvedValue(existingReservations);

      const result = await service.createReservation(input);

      expect(customerRepo.findOne).toHaveBeenCalled();
      expect(reservationRepo.find).toHaveBeenCalled();
      expect(reservationRepo.create).not.toHaveBeenCalled();
      expect(reservationRepo.save).not.toHaveBeenCalled();
      expect(result.message).toContain('unavailable');
      expect(result.availableSlots.length).toBeGreaterThan(0);
    });
  });

  describe('cancelReservation', () => {
    it('should cancel an existing reservation', async () => {
      const id = 1;

      reservationRepo.delete.mockResolvedValue({ affected: 1 });

      const result = await service.cancelReservation(id);

      expect(reservationRepo.delete).toHaveBeenCalledWith(id);
      expect(redisService.clearReservationCache).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw NotFoundException if reservation does not exist', async () => {
      const id = 999;

      reservationRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.cancelReservation(id)).rejects.toThrow(
        NotFoundException,
      );
      expect(reservationRepo.delete).toHaveBeenCalledWith(id);
      expect(redisService.clearReservationCache).not.toHaveBeenCalled();
    });
  });

  describe('updateReservation', () => {
    it('should update an existing reservation', async () => {
      const input: UpdateReservationInput = {
        id: 1,
        guests: 4,
      };

      const existingReservation = {
        id: 1,
        date: '2025-05-01',
        time: '18:00',
        guests: 2,
        customer: { id: 1, name: 'John Doe' },
      };

      const updatedReservation = {
        ...existingReservation,
        guests: input.guests,
      };

      reservationRepo.findOne.mockResolvedValue(existingReservation);
      reservationRepo.save.mockResolvedValue(updatedReservation);

      const result = await service.updateReservation(input);

      expect(reservationRepo.findOne).toHaveBeenCalled();
      expect(reservationRepo.save).toHaveBeenCalled();
      expect(redisService.clearReservationCache).toHaveBeenCalled();
      expect(result).toEqual(updatedReservation);
    });

    it('should throw NotFoundException if reservation does not exist', async () => {
      const input: UpdateReservationInput = {
        id: 999,
        guests: 4,
      };

      reservationRepo.findOne.mockResolvedValue(null);

      await expect(service.updateReservation(input)).rejects.toThrow(
        NotFoundException,
      );
      expect(reservationRepo.findOne).toHaveBeenCalled();
      expect(reservationRepo.save).not.toHaveBeenCalled();
      expect(redisService.clearReservationCache).not.toHaveBeenCalled();
    });
  });
});
