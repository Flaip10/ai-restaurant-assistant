import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Reservation } from '../reservation.entity';

@ObjectType()
class ListInfo {
  @Field(() => Int)
  totalItems?: number;
}

@ObjectType()
export class ReservationPaginationOutput {
  @Field(() => [Reservation])
  items?: Reservation[];

  @Field(() => ListInfo)
  listInfo?: ListInfo;
}
