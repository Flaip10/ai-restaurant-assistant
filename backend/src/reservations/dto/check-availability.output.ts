import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CheckAvailabilityOutput {
  @Field()
  message?: string;

  @Field(() => [String], {
    nullable: true,
    description: 'Available time slots',
  })
  availableSlots?: string[];
}
