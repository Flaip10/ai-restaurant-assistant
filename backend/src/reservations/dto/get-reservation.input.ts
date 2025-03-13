import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class ReservationFilterInput {
  @Field({ nullable: true }) // Nullable so it's optional
  customerName?: string;

  @Field({ nullable: true })
  date?: string;

  @Field(() => Int, { nullable: true })
  guests?: number;
}
