import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Reservation } from './reservation.entity';
import { User } from 'src/users/user.entity';

import { ReservationResolver } from './reservation.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, User])],
  providers: [ReservationResolver],
})
export class ReservationModule {}
