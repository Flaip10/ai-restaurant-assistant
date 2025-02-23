import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsInt,
  IsDateString,
  Min,
  IsNotEmpty,
  Matches,
} from 'class-validator';

@InputType()
export class CreateReservationInput {
  @Field({ description: 'Name of the user making the reservation' })
  @IsString()
  @IsNotEmpty({ message: 'User name is required' })
  userName!: string;

  @Field({ description: 'Date of the reservation (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty({ message: 'Date is required' })
  date!: string;

  @Field({ description: 'Time of the reservation (HH:MM)' })
  @IsNotEmpty({ message: 'Time is required' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Invalid time format. Use HH:MM (24-hour format)',
  })
  time!: string;

  @Field({ description: 'Number of guests for the reservation' })
  @IsNotEmpty({ message: 'Guests count is required' })
  @IsInt()
  @Min(1)
  guests!: number;
}
