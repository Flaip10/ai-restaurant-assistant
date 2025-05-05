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

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Mock Data                                                          */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Mock Helpers                                                       */
/* ------------------------------------------------------------------ */

function createMockService(): MockReservationService {
  return {
    getReservations: jest.fn(),
    checkAvailability: jest.fn(),
    createReservation: jest.fn(),
    cancelReservation: jest.fn(),
    updateReservation: jest.fn(),
  };
}

/* ------------------------------------------------------------------ */
/* Main Test Suite                                                    */
/* ------------------------------------------------------------------ */

describe('ReservationResolver', () => {
  let resolver: ReservationResolver;
  let service: MockReservationService;

  /* ------------------------------------------------------------------ */
  /* Test Setup                                                         */
  /* ------------------------------------------------------------------ */
  beforeEach(async () => {
    service = createMockService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationResolver,
        { provide: ReservationService, useValue: service },
      ],
    }).compile();

    resolver = module.get<ReservationResolver>(ReservationResolver);
  });

  /* ------------------------------------------------------------------ */
  /* Basic Existence                                                    */
  /* ------------------------------------------------------------------ */
  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  /* ------------------------------------------------------------------ */
  /* getReservations                                                    */
  /* ------------------------------------------------------------------ */
  describe('getReservations', () => {
    const filter: ReservationFilterInput = { date: '2025-05-01' };
    const pagination: PaginationInput = { page: 1, limit: 10 };
    const sort: SortInput = { sortBy: 'date' as const, order: 'ASC' as const };
    const expectedResult: ReservationPaginationOutput = {
      items: [mockReservation],
      listInfo: { totalItems: 1 },
    };

    beforeEach(() => {
      service.getReservations.mockReset();
      service.getReservations.mockResolvedValue(expectedResult);
    });

    it('should call service with correct parameters', async () => {
      const result = await resolver.getReservations(filter, pagination, sort);

      expect(service.getReservations).toHaveBeenCalledTimes(1);
      expect(service.getReservations).toHaveBeenCalledWith(
        filter,
        pagination,
        sort,
      );
      expect(result).toStrictEqual(expectedResult);
    });
  });

  /* ------------------------------------------------------------------ */
  /* checkAvailability                                                  */
  /* ------------------------------------------------------------------ */
  describe('checkAvailability', () => {
    const input: CheckAvailabilityInput = {
      date: '2025-05-01',
      time: '18:00',
      guests: 4,
    };
    const expectedResult: CheckAvailabilityOutput = {
      message: 'Time slot available',
      availableSlots: ['18:00'],
    };

    beforeEach(() => {
      service.checkAvailability.mockReset();
      service.checkAvailability.mockResolvedValue(expectedResult);
    });

    it('should call service with correct parameters', async () => {
      const result = await resolver.checkAvailability(input);

      expect(service.checkAvailability).toHaveBeenCalledTimes(1);
      expect(service.checkAvailability).toHaveBeenCalledWith(input);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  /* ------------------------------------------------------------------ */
  /* createReservation                                                  */
  /* ------------------------------------------------------------------ */
  describe('createReservation', () => {
    const input: CreateReservationInput = {
      customerName: 'John Doe',
      date: '2025-05-01',
      time: '18:00',
      guests: 4,
    };
    const expectedResult: CreateReservationOutput = {
      message: 'Reservation successfully created!',
      availableSlots: [],
      reservation: mockReservation,
    };

    beforeEach(() => {
      service.createReservation.mockReset();
      service.createReservation.mockResolvedValue(expectedResult);
    });

    it('should call service with correct parameters', async () => {
      const result = await resolver.createReservation(input);

      expect(service.createReservation).toHaveBeenCalledTimes(1);
      expect(service.createReservation).toHaveBeenCalledWith(input);
      expect(result).toStrictEqual(expectedResult);
    });
  });

  /* ------------------------------------------------------------------ */
  /* cancelReservation                                                  */
  /* ------------------------------------------------------------------ */
  describe('cancelReservation', () => {
    const id = 1;

    beforeEach(() => {
      service.cancelReservation.mockReset();
      service.cancelReservation.mockResolvedValue(true);
    });

    it('should call service with correct parameters', async () => {
      const result = await resolver.cancelReservation(id);

      expect(service.cancelReservation).toHaveBeenCalledTimes(1);
      expect(service.cancelReservation).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });
  });

  /* ------------------------------------------------------------------ */
  /* updateReservation                                                  */
  /* ------------------------------------------------------------------ */
  describe('updateReservation', () => {
    const input: UpdateReservationInput = {
      id: 1,
      guests: 6,
    };
    const expectedResult: Reservation = {
      ...mockReservation,
      guests: 6,
    };

    beforeEach(() => {
      service.updateReservation.mockReset();
      service.updateReservation.mockResolvedValue(expectedResult);
    });

    it('should call service with correct parameters', async () => {
      const result = await resolver.updateReservation(input);

      expect(service.updateReservation).toHaveBeenCalledTimes(1);
      expect(service.updateReservation).toHaveBeenCalledWith(input);
      expect(result).toStrictEqual(expectedResult);
    });
  });
});
