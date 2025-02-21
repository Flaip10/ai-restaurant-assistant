import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres', // Change if needed
      password: 'password', // Change if needed
      database: 'restaurant_reservations',
      autoLoadEntities: true, // Automatically load entities
      synchronize: true, // Auto-create tables (disable in production)
    }),
  ],
})
export class DatabaseModule {}
