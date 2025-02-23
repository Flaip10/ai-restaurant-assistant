import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './reservation.entity';
import { CreateReservationInput } from './dto/create-reservation.input';
import { UpdateReservationInput } from './dto/update-reservation.input';

@Resolver(() => Reservation)
export class ReservationResolver {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
  ) {}

  @Query(() => [Reservation], {
    description: 'Get all reservations from the database',
  })
  async getReservations() {
    return this.reservationRepo.find();
  }

  @Mutation(() => Reservation, { description: 'Create a new reservation' })
  async createReservation(
    @Args('data') data: CreateReservationInput,
  ): Promise<Reservation> {
    const newReservation = this.reservationRepo.create(data);
    return await this.reservationRepo.save(newReservation);
  }

  @Mutation(() => Boolean, { description: 'Cancel a reservation by ID' })
  async cancelReservation(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<boolean> {
    const result = await this.reservationRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  @Mutation(() => Reservation, {
    description: 'Update an existing reservation',
  })
  async updateReservation(
    @Args('data') data: UpdateReservationInput,
  ): Promise<Reservation> {
    const reservation = await this.reservationRepo.findOne({
      where: { id: data.id },
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    Object.assign(reservation, data);
    return await this.reservationRepo.save(reservation);
  }
}
