import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './reservation.entity';
import { ReservationResolver } from './reservation.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation])],
  providers: [ReservationResolver],
})
export class ReservationModule {}
