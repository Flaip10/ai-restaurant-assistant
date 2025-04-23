import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Reservation } from '../reservations/reservation.entity';
import { Customer } from '../customers/customer.entity';

config(); // Load environment variables

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Reservation, Customer],
  migrations: ['src/database/migrations/*.ts'], // Ensure migrations are loaded
  synchronize: process.env.NODE_ENV === 'development', // Only enable in development
  logging: true, // Enable logs for debugging
});
