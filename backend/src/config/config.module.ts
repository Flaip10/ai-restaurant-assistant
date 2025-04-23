import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(), // Must be a string and required
        DB_PORT: Joi.number().default(5432), // Must be a number with default value
        DB_USER: Joi.string().required(), // Required string
        DB_PASSWORD: Joi.string().required(), // Required string
        DB_NAME: Joi.string().required(), // Required string
        TOTAL_SEATS: Joi.number().default(10), // Must be a number, default is 10
        SLOT_DURATION: Joi.number().default(30), // Must be a number, default is 30 minutes
        RESERVATION_DURATION: Joi.number().default(60), // Default reservation is 1 hour
        REDIS_HOST: Joi.string().default('localhost'), // Redis host with default
        REDIS_PORT: Joi.number().default(6379), // Redis port with default
        JWT_SECRET: Joi.string().required(),
      }),
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
