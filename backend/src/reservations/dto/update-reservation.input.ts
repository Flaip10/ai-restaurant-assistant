import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateReservationInput } from './create-reservation.input';
import { IsInt } from 'class-validator';

@InputType()
export class UpdateReservationInput extends PartialType(
  CreateReservationInput,
) {
  @Field(() => Int)
  @IsInt({ message: 'ID must be an integer' })
  id!: number;
}
