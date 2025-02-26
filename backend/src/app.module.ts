import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { GraphqlModule } from './graphql/graphql.module';
import { DatabaseModule } from './database/database.module';
import { ReservationModule } from './reservations/reservation.module';
import { ConfigModule } from './config/config.module';
import { RedisConfigModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    GraphqlModule,
    DatabaseModule,
    ReservationModule,
    RedisConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
