import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InputType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  Min,
  Matches,
  IsOptional,
  ValidateNested,
  ValidateIf,
} from 'class-validator';

@InputType()
export class TimeRangeInput {
  @Field({ description: 'Start time in HH:mm format (24-hour)' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Time must be in HH:mm format (24-hour)',
  })
  start!: string;

  @Field({ description: 'End time in HH:mm format (24-hour)' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Time must be in HH:mm format (24-hour)',
  })
  @IsOptional()
  end!: string;
}

@InputType()
export class CheckAvailabilityInput {
  @Field()
  @IsDateString({}, { message: 'Date must be in YYYY-MM-DD format' })
  date!: string;

  @Field({ nullable: true })
  @ValidateIf((o) => !o.timeRange) // Only required if timeRange is not provided
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Time must be in HH:mm format (24-hour)',
  })
  time?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1, { message: 'Guests must be at least 1' })
  guests!: number;

  @Field(() => TimeRangeInput, { nullable: true })
  @ValidateIf((o) => !o.time) // Only required if time is not provided
  @ValidateNested()
  @Type(() => TimeRangeInput)
  timeRange?: TimeRangeInput;
}
