import { Field, ObjectType } from '@nestjs/graphql';
import { Reservation } from '../reservation.entity';

@ObjectType()
export class CreateReservationOutput {
  @Field(() => String)
  message!: string;

  @Field(() => [String], { nullable: true })
  availableSlots?: string[];

  @Field(() => Reservation, { nullable: true })
  reservation?: Reservation;
}
