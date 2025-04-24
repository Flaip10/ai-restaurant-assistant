import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Reservation } from './reservation.entity';
import { Customer } from '../customers/customer.entity';

import { ReservationResolver } from './reservation.resolver';
import { ReservationService } from './reservation.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, Customer]), RedisModule],
  providers: [ReservationResolver, ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
