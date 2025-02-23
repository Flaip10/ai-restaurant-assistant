import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './reservation.entity';
import { CreateReservationInput } from './dto/create-reservation.input';
import { UpdateReservationInput } from './dto/update-reservation.input';
import {
  NotFoundException,
  InternalServerErrorException,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { User } from 'src/users/user.entity';
import { ReservationFilterInput } from './dto/get-reservation.input';
import { PaginationInput } from './dto/pagination.input';
import { SortInput } from './dto/sort.input';
import { ReservationPaginationOutput } from './dto/get-reservation.output';

@Resolver(() => Reservation)
export class ReservationResolver {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Query(() => ReservationPaginationOutput, {
    description: 'Get all reservations from the database',
  })
  async getReservations(
    @Args('filter', { type: () => ReservationFilterInput, nullable: true })
    filter?: ReservationFilterInput,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('sort', { type: () => SortInput, nullable: true }) sort?: SortInput,
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

  @Mutation(() => Reservation, { description: 'Create a new reservation' })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException(
          errors
            .map((err) =>
              err.constraints
                ? Object.values(err.constraints).join(', ')
                : 'Invalid input',
            )
            .join('; '),
        ),
    }),
  )
  async createReservation(
    @Args('data') data: CreateReservationInput,
  ): Promise<Reservation> {
    try {
      let user = await this.userRepo.findOne({
        where: { name: data.userName },
      });

      if (!user) {
        user = this.userRepo.create({ name: data.userName });
        await this.userRepo.save(user);
      }

      const newReservation = this.reservationRepo.create({ ...data, user });
      return await this.reservationRepo.save(newReservation);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create reservation');
    }
  }

  @Mutation(() => Boolean, { description: 'Cancel a reservation by ID' })
  async cancelReservation(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
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

  @Mutation(() => Reservation, {
    description: 'Update an existing reservation',
  })
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException(
          errors
            .map((err) =>
              err.constraints
                ? Object.values(err.constraints).join(', ')
                : 'Invalid input',
            )
            .join('; '),
        ),
    }),
  )
  async updateReservation(
    @Args('data') data: UpdateReservationInput,
  ): Promise<Reservation> {
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
