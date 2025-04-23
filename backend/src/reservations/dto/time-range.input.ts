import { Field, InputType } from '@nestjs/graphql';
import { Matches, IsOptional } from 'class-validator';

@InputType()
export class TimeRangeInput {
  @Field({ description: 'Start time in HH:mm format (24-hour)' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Time must be in HH:mm format (24-hour)',
  })
  start!: string;

  @Field({ description: 'End time in HH:mm format (24-hour)' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Time must be in HH:mm format (24-hour)',
  })
  @IsOptional()
  end!: string;
}
