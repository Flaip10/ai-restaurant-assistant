import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Reservation } from './reservation.entity';
import { Customer } from '../customers/customer.entity';
import { CreateReservationInput } from './dto/create-reservation.input';
import { ReservationPaginationOutput } from './dto/get-reservation.output';
import { ReservationFilterInput } from './dto/get-reservation.input';
import { PaginationInput } from './dto/pagination.input';
import { SortInput } from './dto/sort.input';
import { UpdateReservationInput } from './dto/update-reservation.input';

import { convertToMinutes, convertToTime } from 'src/utils/time.utils';
import {
  findAvailableSlots,
  findNearestAvailableSlots,
  isSlotAvailable,
} from 'src/utils/reservation.utils';
import { CreateReservationOutput } from './dto/create-reservation.output';
import { CheckAvailabilityInput } from './dto/check-availability.input';
import { CheckAvailabilityOutput } from './dto/check-availability.output';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ReservationService {
  private readonly totalSeats: number;
  private readonly slotDuration: number;
  private readonly reservationDuration: number;

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,

    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,

    private readonly configService: ConfigService,

    private readonly redisService: RedisService,
  ) {
    this.totalSeats = this.configService.get<number>('TOTAL_SEATS', 10);
    this.slotDuration = this.configService.get<number>('SLOT_DURATION', 30);
    this.reservationDuration = this.configService.get<number>(
      'RESERVATION_DURATION',
      60,
    );
  }

  async getReservations(
    filter?: ReservationFilterInput,
    pagination?: PaginationInput,
    sort?: SortInput,
  ): Promise<ReservationPaginationOutput> {
    try {
      // Generate a unique cache key based on filters
      const cacheKey = `reservations:${JSON.stringify(filter)}:${JSON.stringify(pagination)}:${JSON.stringify(sort)}`;

      // 🔍 Check Redis Cache
      const cachedData =
        await this.redisService.get<ReservationPaginationOutput>(cacheKey);
      if (cachedData) {
        return cachedData; //Return cached data
      }

      const query = this.reservationRepo
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.customer', 'customer');

      // Apply Filters
      if (filter?.customerName) {
        query.andWhere('customer.name = :customerName', {
          customerName: filter.customerName,
        });
      }
      if (filter?.date) {
        query.andWhere('reservation.date = :date', { date: filter.date });
      }
      if (filter?.guests) {
        query.andWhere('reservation.guests = :guests', {
          guests: filter.guests,
        });
      }

      // Apply Sorting
      if (sort?.sortBy) {
        query.orderBy(
          `reservation.${sort.sortBy}`,
          sort.order === 'DESC' ? 'DESC' : 'ASC',
        );
      }

      // Apply Pagination
      const page = pagination?.page ?? 1;
      const limit = pagination?.limit ?? 10;
      query.skip((page - 1) * limit).take(limit);

      const items = await query.getMany();

      // Get total count before pagination
      const totalItems = await query.getCount();

      const result = {
        items,
        listInfo: { totalItems },
      };

      // Store in Redis Cache (Set TTL for 5 minutes)
      await this.redisService.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch reservations');
    }
  }

  async checkAvailability(
    data: CheckAvailabilityInput,
  ): Promise<CheckAvailabilityOutput> {
    try {
      const { date, guests, time, timeRange } = data;

      // Generate a unique cache key based on query parameters
      const cacheKey = `availability:${date}:${time || timeRange?.start}-${timeRange?.end || 'none'}:${guests}`;

      // Try to fetch cached data from Redis
      const cachedResult =
        await this.redisService.get<CheckAvailabilityOutput>(cacheKey);
      if (cachedResult) {
        return cachedResult; // Return cached result if available
      }

      // 🔍 Fetch existing reservations for this date
      const existingReservations = await this.reservationRepo.find({
        where: { date: date },
      });

      if (time) {
        // Convert time to slot
        const startTime = convertToMinutes(time);
        const endTime = startTime + this.reservationDuration;

        // Check if requested slot is available
        const isAvailable = isSlotAvailable(
          existingReservations,
          startTime,
          endTime,
          this.totalSeats,
          guests,
        );

        const result: CheckAvailabilityOutput = {
          message: isAvailable
            ? 'Time slot available'
            : 'Time slot unavailable',
          availableSlots: isAvailable ? [time] : [],
        };

        // Store computed result in Redis with expiration of 5 minutes (300 seconds)
        await this.redisService.set(cacheKey, result, 300);

        return result;
      } else if (timeRange) {
        // Fetch All Available Slots in the Given Range
        const startSlot = convertToMinutes(timeRange.start) / this.slotDuration;
        const endSlot = convertToMinutes(timeRange.end) / this.slotDuration;

        const availableSlots = findAvailableSlots(
          existingReservations,
          { startSlot, endSlot },
          this.slotDuration,
          this.totalSeats,
          guests,
          this.reservationDuration,
        );

        const result: CheckAvailabilityOutput = {
          message:
            availableSlots.length > 0
              ? 'Available slots within range'
              : 'No available slots in the given range',
          availableSlots: availableSlots.map((slot) =>
            convertToTime(slot * this.slotDuration),
          ),
        };

        await this.redisService.set(cacheKey, result, 300);

        return result;
      }

      return {
        availableSlots: [],
        message:
          'Invalid request: Please provide either a specific time or a time range.',
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to check availability');
    }
  }

  async createReservation(
    data: CreateReservationInput,
  ): Promise<CreateReservationOutput> {
    try {
      // Check if customer exists or create one
      let customer = await this.customerRepo.findOne({
        where: { name: data.customerName },
      });
      if (!customer) {
        customer = this.customerRepo.create({ name: data.customerName });
        await this.customerRepo.save(customer);
      }

      // Convert time to slots
      const startTime = convertToMinutes(data.time);
      const endTime = startTime + this.reservationDuration;

      // 🔍 Fetch existing reservations for this date
      const existingReservations = await this.reservationRepo.find({
        where: { date: data.date },
      });

      // Check if requested slot is available
      if (
        !isSlotAvailable(
          existingReservations,
          startTime,
          endTime,
          this.totalSeats,
          data.guests,
        )
      ) {
        // Find alternative slots
        const nearestSlots = findNearestAvailableSlots(
          existingReservations,
          startTime / this.slotDuration,
          this.slotDuration,
          this.totalSeats,
          data.guests,
          this.reservationDuration,
        );

        if (nearestSlots.length === 0) {
          throw new BadRequestException(
            `No availability for ${data.guests} guests on ${data.date}`,
          );
        }

        return {
          message: `Requested time is unavailable. Suggested available times:`,
          availableSlots: nearestSlots.map((slot) =>
            convertToTime(slot * this.slotDuration),
          ),
        };
      }

      // Proceed with reservation
      const newReservation = this.reservationRepo.create({ ...data, customer });
      const savedReservation = await this.reservationRepo.save(newReservation);

      // Clear cached reservations
      await this.redisService.clearReservationCache();

      return {
        message: 'Reservation successfully created!',
        availableSlots: [],
        reservation: savedReservation,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create reservation');
    }
  }

  async cancelReservation(id: number): Promise<boolean> {
    try {
      const result = await this.reservationRepo.delete(id);

      if ((result.affected ?? 0) === 0) {
        throw new NotFoundException(`Reservation with ID ${id} not found`);
      }

      // Clear cached reservations
      await this.redisService.clearReservationCache();

      return true;
    } catch (error) {
      throw new InternalServerErrorException('Failed to cancel reservation');
    }
  }

  async updateReservation(data: UpdateReservationInput): Promise<Reservation> {
    try {
      const reservation = await this.reservationRepo.findOne({
        where: { id: data.id },
      });

      if (!reservation) {
        throw new NotFoundException(`Reservation with ID ${data.id} not found`);
      }

      Object.assign(reservation, data);

      // Clear cached reservations
      await this.redisService.clearReservationCache();

      return await this.reservationRepo.save(reservation);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update reservation');
    }
  }
}
