import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { Reservation } from './reservation.entity';
import { CreateReservationInput } from './dto/create-reservation.input';
import { UpdateReservationInput } from './dto/update-reservation.input';
import { UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ReservationFilterInput } from './dto/get-reservation.input';
import { PaginationInput } from './dto/pagination.input';
import { SortInput } from './dto/sort.input';
import { ReservationPaginationOutput } from './dto/get-reservation.output';
import { ReservationService } from './reservation.service';
import { CreateReservationOutput } from './dto/create-reservation.output';
import { CheckAvailabilityOutput } from './dto/check-availability.output';
import { CheckAvailabilityInput } from './dto/check-availability.input';

@Resolver(() => Reservation)
export class ReservationResolver {
  constructor(private readonly reservationService: ReservationService) {}

  @Query(() => ReservationPaginationOutput, {
    description: 'Get all reservations from the database',
  })
  async getReservations(
    @Args('filter', { type: () => ReservationFilterInput, nullable: true })
    filter?: ReservationFilterInput,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
    @Args('sort', { type: () => SortInput, nullable: true })
    sort?: SortInput,
  ): Promise<ReservationPaginationOutput> {
    return this.reservationService.getReservations(filter, pagination, sort);
  }

  @Query(() => CheckAvailabilityOutput, {
    description: 'Check if a specific time slot is available',
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
  async checkAvailability(
    @Args('data') data: CheckAvailabilityInput,
  ): Promise<CheckAvailabilityOutput> {
    return this.reservationService.checkAvailability(data);
  }

  @Mutation(() => CreateReservationOutput, {
    description: 'Create a new reservation',
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
  async createReservation(
    @Args('data') data: CreateReservationInput,
  ): Promise<CreateReservationOutput> {
    return this.reservationService.createReservation(data);
  }

  @Mutation(() => Boolean, { description: 'Cancel a reservation by ID' })
  async cancelReservation(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    return this.reservationService.cancelReservation(id);
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
    return this.reservationService.updateReservation(data);
  }
}
