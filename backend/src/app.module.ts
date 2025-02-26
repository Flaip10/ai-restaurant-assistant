import { Module } from '@nestjs/common';

import { GraphqlModule } from './graphql/graphql.module';
import { DatabaseModule } from './database/database.module';
import { ReservationModule } from './reservations/reservation.module';
import { ConfigModule } from './config/config.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    GraphqlModule,
    DatabaseModule,
    RedisModule,
    ReservationModule,
  ],
})
export class AppModule {}
