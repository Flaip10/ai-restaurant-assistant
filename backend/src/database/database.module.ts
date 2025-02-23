import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Reservation } from 'src/reservations/reservation.entity';
import { User } from 'src/users/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot(), // Load .env variables
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, // Auto-create tables (disable in production)
    }),
    TypeOrmModule.forFeature([Reservation, User]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
