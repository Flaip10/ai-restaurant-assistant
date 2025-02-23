import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation } from './reservation.entity';
import { CreateReservationInput } from './dto/create-reservation.input';
import { UpdateReservationInput } from './dto/update-reservation.input';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from 'src/users/user.entity';
import { ReservationFilterInput } from './dto/get-reservation.input';

@Resolver(() => Reservation)
export class ReservationResolver {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Query(() => [Reservation], {
    description: 'Get all reservations from the database',
  })
  async getReservations(
    @Args('filter', { type: () => ReservationFilterInput, nullable: true })
    filter?: ReservationFilterInput,
  ): Promise<Reservation[]> {
    try {
      const query = this.reservationRepo
        .createQueryBuilder('reservation')
        .leftJoinAndSelect('reservation.user', 'user');

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

      return query.getMany();
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch reservations');
    }
  }

  @Mutation(() => Reservation, { description: 'Create a new reservation' })
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
      throw new InternalServerErrorException('Failed to update reservation');
    }
  }
}
