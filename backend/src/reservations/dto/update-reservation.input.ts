import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { CreateReservationInput } from './create-reservation.input';

@InputType()
export class UpdateReservationInput extends PartialType(
  CreateReservationInput,
) {
  @Field(() => Int, { description: 'ID of the reservation to update' })
  id!: number;
}
