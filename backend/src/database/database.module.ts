import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Reservation } from 'src/reservations/reservation.entity';
import { User } from 'src/users/user.entity';

@Module({
  imports: [
    ConfigModule, // Import ConfigModule (loads .env globally)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false, // Use migrations instead of auto-sync in production
      }),
    }),
    TypeOrmModule.forFeature([Reservation, User]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
