import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reservation } from '../src/reservations/reservation.entity';
import { Customer } from '../src/customers/customer.entity';
import { RedisService } from '../src/redis/redis.service';
import { DataSource } from 'typeorm';

describe('ReservationsModule (e2e)', () => {
  let app: INestApplication;
  let reservationRepository;
  let customerRepository;
  let redisService;
  let dataSource: DataSource;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Reservation))
      .useValue({
        find: jest.fn().mockResolvedValue([
          {
            id: 1,
            date: '2025-05-01',
            time: '18:00',
            guests: 4,
            customer: { id: 1, name: 'John Doe' },
          },
        ]),
        findOne: jest.fn(),
        create: jest.fn((entity) => entity),
        save: jest.fn((entity) => ({
          id: 1,
          ...entity,
        })),
        createQueryBuilder: jest.fn(() => ({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([
            {
              id: 1,
              date: '2025-05-01',
              time: '18:00',
              guests: 4,
              customer: { id: 1, name: 'John Doe' },
            },
          ]),
          getCount: jest.fn().mockResolvedValue(1),
        })),
        delete: jest.fn().mockResolvedValue({ affected: 1 }),
      })
      .overrideProvider(getRepositoryToken(Customer))
      .useValue({
        findOne: jest.fn().mockResolvedValue({
          id: 1,
          name: 'John Doe',
        }),
        create: jest.fn((entity) => entity),
        save: jest.fn((entity) => ({
          id: 1,
          ...entity,
        })),
      })
      .overrideProvider(RedisService)
      .useValue({
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn(),
        clearReservationCache: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get(DataSource);
    reservationRepository = moduleFixture.get(getRepositoryToken(Reservation));
    customerRepository = moduleFixture.get(getRepositoryToken(Customer));
    redisService = moduleFixture.get(RedisService);
    await app.init();
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    await app.close();
  });

  describe('Queries', () => {
    it('should get reservations', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getReservations {
                items {
                  id
                  date
                  time
                  guests
                  customer {
                    id
                    name
                  }
                }
                listInfo {
                  totalItems
                }
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.getReservations).toBeDefined();
          expect(res.body.data.getReservations.items).toHaveLength(1);
          expect(res.body.data.getReservations.listInfo.totalItems).toBe(1);
        });
    });

    it('should check availability', () => {
      const mockAvailability = {
        message: 'Time slot available',
        availableSlots: ['18:00'],
      };

      redisService.get.mockResolvedValue(null);
      reservationRepository.find.mockResolvedValue([]);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              checkAvailability(data: {
                date: "2025-05-01",
                time: "18:00",
                guests: 4
              }) {
                message
                availableSlots
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.checkAvailability).toBeDefined();
          expect(res.body.data.checkAvailability.message).toContain(
            'available',
          );
          expect(res.body.data.checkAvailability.availableSlots).toContain(
            '18:00',
          );
        });
    });
  });

  describe('Mutations', () => {
    it('should create a reservation', () => {
      const mockCustomer = { id: 1, name: 'John Doe' };
      const mockReservation = {
        id: 1,
        date: '2025-05-01',
        time: '18:00',
        guests: 4,
        customer: mockCustomer,
      };

      customerRepository.findOne.mockResolvedValue(null);
      customerRepository.save.mockResolvedValue(mockCustomer);
      reservationRepository.find.mockResolvedValue([]);
      reservationRepository.save.mockResolvedValue(mockReservation);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              createReservation(data: {
                customerName: "John Doe",
                date: "2025-05-01",
                time: "18:00",
                guests: 4
              }) {
                message
                reservation {
                  id
                  date
                  time
                  guests
                  customer {
                    id
                    name
                  }
                }
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createReservation).toBeDefined();
          expect(res.body.data.createReservation.message).toContain('created');
          expect(res.body.data.createReservation.reservation.id).toBe(1);
        });
    });

    it('should cancel a reservation', () => {
      reservationRepository.delete.mockResolvedValue({ affected: 1 });

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              cancelReservation(id: 1)
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.cancelReservation).toBe(true);
          expect(reservationRepository.delete).toHaveBeenCalledWith(1);
          expect(redisService.clearReservationCache).toHaveBeenCalled();
        });
    });

    it('should update a reservation', () => {
      const mockReservation = {
        id: 1,
        date: '2025-05-01',
        time: '18:00',
        guests: 6,
        customer: { id: 1, name: 'John Doe' },
      };

      reservationRepository.findOne.mockResolvedValue({
        ...mockReservation,
        guests: 4,
      });
      reservationRepository.save.mockResolvedValue(mockReservation);

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              updateReservation(data: {
                id: 1,
                guests: 6
              }) {
                id
                date
                time
                guests
                customer {
                  id
                  name
                }
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.updateReservation).toBeDefined();
          expect(res.body.data.updateReservation.id).toBe(1);
          expect(res.body.data.updateReservation.guests).toBe(6);
          expect(redisService.clearReservationCache).toHaveBeenCalled();
        });
    });
  });
});
