import { Test, TestingModule } from '@nestjs/testing';
import { ReservationResolver } from './reservation.resolver';
import { ReservationService } from './reservation.service';
import { CreateReservationInput } from './dto/create-reservation.input';
import { UpdateReservationInput } from './dto/update-reservation.input';
import { CheckAvailabilityInput } from './dto/check-availability.input';

// Mock the ReservationService
const mockReservationService = {
  getReservations: jest.fn(),
  checkAvailability: jest.fn(),
  createReservation: jest.fn(),
  cancelReservation: jest.fn(),
  updateReservation: jest.fn(),
};

describe('ReservationResolver', () => {
  let resolver: ReservationResolver;
  let service: ReservationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationResolver,
        {
          provide: ReservationService,
          useValue: mockReservationService,
        },
      ],
    }).compile();

    resolver = module.get<ReservationResolver>(ReservationResolver);
    service = module.get<ReservationService>(ReservationService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getReservations', () => {
    it('should call service.getReservations with the provided arguments', async () => {
      const filter = { date: '2025-05-01' };
      const pagination = { page: 1, limit: 10 };
      const sort = { sortBy: 'date' as 'date', order: 'ASC' as 'ASC' };
      const expectedResult = {
        items: [{ id: 1, date: '2025-05-01', time: '18:00', guests: 4 }],
        listInfo: { totalItems: 1 },
      };

      mockReservationService.getReservations.mockResolvedValue(expectedResult);

      const result = await resolver.getReservations(filter, pagination, sort);

      expect(service.getReservations).toHaveBeenCalledWith(
        filter,
        pagination,
        sort,
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('checkAvailability', () => {
    it('should call service.checkAvailability with the provided data', async () => {
      const input: CheckAvailabilityInput = {
        date: '2025-05-01',
        time: '18:00',
        guests: 4,
      };
      const expectedResult = {
        message: 'Time slot available',
        availableSlots: ['18:00'],
      };

      mockReservationService.checkAvailability.mockResolvedValue(
        expectedResult,
      );

      const result = await resolver.checkAvailability(input);

      expect(service.checkAvailability).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createReservation', () => {
    it('should call service.createReservation with the provided data', async () => {
      const input: CreateReservationInput = {
        customerName: 'John Doe',
        date: '2025-05-01',
        time: '18:00',
        guests: 4,
      };
      const expectedResult = {
        message: 'Reservation successfully created!',
        availableSlots: [],
        reservation: {
          id: 1,
          ...input,
          customer: { id: 1, name: 'John Doe' },
        },
      };

      mockReservationService.createReservation.mockResolvedValue(
        expectedResult,
      );

      const result = await resolver.createReservation(input);

      expect(service.createReservation).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('cancelReservation', () => {
    it('should call service.cancelReservation with the provided id', async () => {
      const id = 1;
      mockReservationService.cancelReservation.mockResolvedValue(true);

      const result = await resolver.cancelReservation(id);

      expect(service.cancelReservation).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });
  });

  describe('updateReservation', () => {
    it('should call service.updateReservation with the provided data', async () => {
      const input: UpdateReservationInput = {
        id: 1,
        guests: 6,
      };
      const expectedResult = {
        id: 1,
        date: '2025-05-01',
        time: '18:00',
        guests: 6,
        customer: { id: 1, name: 'John Doe' },
      };

      mockReservationService.updateReservation.mockResolvedValue(
        expectedResult,
      );

      const result = await resolver.updateReservation(input);

      expect(service.updateReservation).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedResult);
    });
  });
});
