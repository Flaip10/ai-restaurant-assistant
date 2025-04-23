import { Test, TestingModule } from '@nestjs/testing';
import { ReservationResolver } from './reservation.resolver';
import { ReservationService } from './reservation.service';
import { CreateReservationInput } from './dto/create-reservation.input';
import { UpdateReservationInput } from './dto/update-reservation.input';
import { CheckAvailabilityInput } from './dto/check-availability.input';
import { Reservation } from './reservation.entity';
import { Customer } from '../customers/customer.entity';
import { ReservationPaginationOutput } from './dto/get-reservation.output';
import { CreateReservationOutput } from './dto/create-reservation.output';
import { CheckAvailabilityOutput } from './dto/check-availability.output';
import { ReservationFilterInput } from './dto/get-reservation.input';
import { PaginationInput } from './dto/pagination.input';
import { SortInput } from './dto/sort.input';

type MockReservationService = {
  getReservations: jest.Mock<
    Promise<ReservationPaginationOutput>,
    [
      ReservationFilterInput | undefined,
      PaginationInput | undefined,
      SortInput | undefined,
    ]
  >;
  checkAvailability: jest.Mock<
    Promise<CheckAvailabilityOutput>,
    [CheckAvailabilityInput]
  >;
  createReservation: jest.Mock<
    Promise<CreateReservationOutput>,
    [CreateReservationInput]
  >;
  cancelReservation: jest.Mock<Promise<boolean>, [number]>;
  updateReservation: jest.Mock<Promise<Reservation>, [UpdateReservationInput]>;
};

describe('ReservationResolver', () => {
  let resolver: ReservationResolver;
  let service: MockReservationService;

  beforeEach(async () => {
    const mockService: MockReservationService = {
      getReservations: jest.fn<
        Promise<ReservationPaginationOutput>,
        [
          ReservationFilterInput | undefined,
          PaginationInput | undefined,
          SortInput | undefined,
        ]
      >(),
      checkAvailability: jest.fn<
        Promise<CheckAvailabilityOutput>,
        [CheckAvailabilityInput]
      >(),
      createReservation: jest.fn<
        Promise<CreateReservationOutput>,
        [CreateReservationInput]
      >(),
      cancelReservation: jest.fn<Promise<boolean>, [number]>(),
      updateReservation: jest.fn<
        Promise<Reservation>,
        [UpdateReservationInput]
      >(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationResolver,
        {
          provide: ReservationService,
          useValue: mockService,
        },
      ],
    }).compile();

    resolver = module.get<ReservationResolver>(ReservationResolver);
    service = module.get(ReservationService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getReservations', () => {
    const mockCall = async () => {
      const filter = { date: '2025-05-01' };
      const pagination = { page: 1, limit: 10 };
      const sort = { sortBy: 'date' as const, order: 'ASC' as const };

      const mockCustomer: Customer = {
        id: 1,
        name: 'John Doe',
        reservations: [],
      };

      const mockReservation: Reservation = {
        id: 1,
        date: '2025-05-01',
        time: '18:00',
        guests: 4,
        customer: mockCustomer,
      };

      const expectedResult = {
        items: [mockReservation],
        listInfo: { totalItems: 1 },
      };

      service.getReservations.mockResolvedValue(expectedResult);
      const result = await resolver.getReservations(filter, pagination, sort);

      return { filter, pagination, sort, expectedResult, result };
    };

    it('should call service with correct parameters', async () => {
      const { filter, pagination, sort, result, expectedResult } =
        await mockCall();

      // Verify the mock was called with correct parameters
      expect(service.getReservations.mock.calls.length).toBe(1);
      expect(service.getReservations.mock.calls[0][0]).toBe(filter);
      expect(service.getReservations.mock.calls[0][1]).toBe(pagination);
      expect(service.getReservations.mock.calls[0][2]).toBe(sort);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('checkAvailability', () => {
    const mockCall = async () => {
      const input: CheckAvailabilityInput = {
        date: '2025-05-01',
        time: '18:00',
        guests: 4,
      };
      const expectedResult = {
        message: 'Time slot available',
        availableSlots: ['18:00'],
      };

      service.checkAvailability.mockResolvedValue(expectedResult);
      const result = await resolver.checkAvailability(input);

      return { input, expectedResult, result };
    };

    it('should call service with correct parameters', async () => {
      const { input, result, expectedResult } = await mockCall();

      // Verify the mock was called with correct parameters
      expect(service.checkAvailability.mock.calls.length).toBe(1);
      expect(service.checkAvailability.mock.calls[0][0]).toBe(input);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('createReservation', () => {
    const mockCall = async () => {
      const input: CreateReservationInput = {
        customerName: 'John Doe',
        date: '2025-05-01',
        time: '18:00',
        guests: 4,
      };

      const mockCustomer: Customer = {
        id: 1,
        name: 'John Doe',
        reservations: [],
      };

      const mockReservation: Reservation = {
        id: 1,
        date: '2025-05-01',
        time: '18:00',
        guests: 4,
        customer: mockCustomer,
      };

      const expectedResult = {
        message: 'Reservation successfully created!',
        availableSlots: [],
        reservation: mockReservation,
      };

      service.createReservation.mockResolvedValue(expectedResult);
      const result = await resolver.createReservation(input);

      return { input, expectedResult, result };
    };

    it('should call service with correct parameters', async () => {
      const { input, result, expectedResult } = await mockCall();

      // Verify the mock was called with correct parameters
      expect(service.createReservation.mock.calls.length).toBe(1);
      expect(service.createReservation.mock.calls[0][0]).toBe(input);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('cancelReservation', () => {
    const mockCall = async () => {
      const id = 1;
      service.cancelReservation.mockResolvedValue(true);
      const result = await resolver.cancelReservation(id);

      return { id, result };
    };

    it('should call service with correct parameters', async () => {
      const { id, result } = await mockCall();

      // Verify the mock was called with correct parameters
      expect(service.cancelReservation.mock.calls.length).toBe(1);
      expect(service.cancelReservation.mock.calls[0][0]).toBe(id);
      expect(result).toBe(true);
    });
  });

  describe('updateReservation', () => {
    const mockCall = async () => {
      const input: UpdateReservationInput = {
        id: 1,
        guests: 6,
      };

      const mockCustomer: Customer = {
        id: 1,
        name: 'John Doe',
        reservations: [],
      };

      const expectedResult: Reservation = {
        id: 1,
        date: '2025-05-01',
        time: '18:00',
        guests: 6,
        customer: mockCustomer,
      };

      service.updateReservation.mockResolvedValue(expectedResult);
      const result = await resolver.updateReservation(input);

      return { input, expectedResult, result };
    };

    it('should call service with correct parameters', async () => {
      const { input, result, expectedResult } = await mockCall();

      // Verify the mock was called with correct parameters
      expect(service.updateReservation.mock.calls.length).toBe(1);
      expect(service.updateReservation.mock.calls[0][0]).toBe(input);
      expect(result).toStrictEqual(expectedResult);
    });
  });
});
