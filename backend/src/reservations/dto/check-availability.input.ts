import { InputType, Field, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, Min, Matches, ValidateIf } from 'class-validator';
import { TimeOrRange } from '../../decorators/time-or-range.decorator';
import { TimeRangeInput } from './time-range.input';

@InputType()
export class CheckAvailabilityInput {
  @Field()
  @IsDateString({}, { message: 'Date must be in YYYY-MM-DD format' })
  date!: string;

  @TimeOrRange({ message: 'Either time or timeRange must be provided.' })
  @Field(() => String, { nullable: true })
  @ValidateIf((o: CheckAvailabilityInput) => !o.timeRange)
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Time must be in HH:mm format (24-hour)',
  })
  time?: string;

  @TimeOrRange({ message: 'Either time or timeRange must be provided.' })
  @Field(() => TimeRangeInput, { nullable: true })
  @ValidateIf((o: CheckAvailabilityInput) => !o.time)
  @Type(() => TimeRangeInput)
  timeRange?: TimeRangeInput;

  @Field(() => Int)
  @IsInt()
  @Min(1, { message: 'Guests must be at least 1' })
  guests!: number;
}
