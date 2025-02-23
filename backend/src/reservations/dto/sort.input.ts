import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SortInput {
  @Field({ nullable: true })
  sortBy?: 'date' | 'guests'; // Sort by either date or guests

  @Field({ nullable: true, defaultValue: 'ASC' })
  order?: 'ASC' | 'DESC'; // Ascending or descending order
}
