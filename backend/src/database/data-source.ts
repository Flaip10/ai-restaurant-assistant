import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Reservation } from '../reservations/reservation.entity';
import { Customer } from '../customers/customer.entity';
import { User } from '../user/user.entity';

config(); // Load environment variables

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Reservation, Customer, User],
  migrations: ['src/database/migrations/*.ts'], // Ensure migrations are loaded
  synchronize: true, // Temporarily enable synchronize
  logging: true, // Enable logs for debugging
});
