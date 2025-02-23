import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsInt, IsDateString, Min } from 'class-validator';

@InputType()
export class CreateReservationInput {
  @Field({ description: 'Name of the person making the reservation' })
  @IsString() // Validation happens here
  name: string;

  @Field({ description: 'Date of the reservation (YYYY-MM-DD)' })
  @IsDateString() // Ensures correct date format
  date: string;

  @Field({ description: 'Time of the reservation (HH:MM)' })
  @IsString()
  time: string;

  @Field({ description: 'Number of guests for the reservation' })
  @IsInt()
  @Min(1) // Ensures at least 1 guest
  guests: number;
}
