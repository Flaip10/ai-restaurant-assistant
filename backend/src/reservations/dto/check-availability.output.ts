import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class CheckAvailabilityOutput {
  @Field()
  message?: string;

  @Field(() => Boolean, {
    description: 'Whether the requested time is available',
  })
  isAvailable!: boolean;
}
