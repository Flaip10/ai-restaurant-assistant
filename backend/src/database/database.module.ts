import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Reservation } from '../reservations/reservation.entity';
import { Customer } from '../customers/customer.entity';
import { AppDataSource } from './data-source'; // Import DataSource

@Module({
  imports: [
    ConfigModule, // Load environment variables globally
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async () => {
        return {
          ...AppDataSource.options, // Use the same config from data-source.ts
          autoLoadEntities: true,
        };
      },
    }),
    TypeOrmModule.forFeature([Reservation, Customer]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
