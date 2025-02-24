import { InputType, Field, Int } from '@nestjs/graphql';
import { IsDateString, IsInt, Min, Max, Matches } from 'class-validator';

@InputType()
export class CheckAvailabilityInput {
  @Field()
  @IsDateString({}, { message: 'Date must be in YYYY-MM-DD format' })
  date!: string;

  @Field()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Time must be in HH:mm format (24-hour)',
  })
  time!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(10) // Adjust based on restaurant capacity
  guests!: number;
}
