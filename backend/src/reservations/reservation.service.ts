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
import { User } from '../users/user.entity';
import { CreateReservationInput } from './dto/create-reservation.input';
import { ReservationPaginationOutput } from './dto/get-reservation.output';
import { ReservationFilterInput } from './dto/get-reservation.input';
import { PaginationInput } from './dto/pagination.input';
import { SortInput } from './dto/sort.input';
import { UpdateReservationInput } from './dto/update-reservation.input';

import { convertToMinutes, convertToTime } from 'src/utils/time.utils';
import {
  findNearestAvailableSlots,
  isSlotAvailable,
} from 'src/utils/reservation.utils';
import { CreateReservationOutput } from './dto/create-reservation.output';
import { CheckAvailabilityInput } from './dto/check-availability.input';
import { CheckAvailabilityOutput } from './dto/check-availability.output';

@Injectable()
export class ReservationService {
  private readonly totalSeats: number;
  private readonly slotDuration: number;
  private readonly reservationDuration: number;

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly configService: ConfigService,
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
      const query = this.reservationRepo
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.user', 'user');

      // Apply Filters
      if (filter?.userName) {
        query.andWhere('user.name = :userName', { userName: filter.userName });
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

      return {
        items,
        listInfo: { totalItems },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch reservations');
    }
  }

  async checkAvailability(
    data: CheckAvailabilityInput,
  ): Promise<CheckAvailabilityOutput> {
    try {
      // Convert time to slot
      const startTime = convertToMinutes(data.time);
      const endTime = startTime + this.reservationDuration;

      // 🔍 Fetch existing reservations for this date
      const existingReservations = await this.reservationRepo.find({
        where: { date: data.date },
      });

      // Check if requested slot is available
      const isAvailable = isSlotAvailable(
        existingReservations,
        startTime,
        endTime,
        this.totalSeats,
        data.guests,
      );

      return {
        message: isAvailable
          ? 'Time slot is available!'
          : 'Time slot is not available!',
        isAvailable,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to check availability');
    }
  }

  async createReservation(
    data: CreateReservationInput,
  ): Promise<CreateReservationOutput> {
    try {
      // Check if user exists or create one
      let user = await this.userRepo.findOne({
        where: { name: data.userName },
      });
      if (!user) {
        user = this.userRepo.create({ name: data.userName });
        await this.userRepo.save(user);
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
      const newReservation = this.reservationRepo.create({ ...data, user });
      const savedReservation = await this.reservationRepo.save(newReservation);
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
