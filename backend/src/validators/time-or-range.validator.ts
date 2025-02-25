import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';

@ValidatorConstraint({ name: 'TimeOrRangeValidator', async: false })
export class TimeOrRangeValidator implements ValidatorConstraintInterface {
  validate(value: any, _args: ValidationArguments): boolean {
    if (!value) {
      throw new BadRequestException(
        'Either time or timeRange must be provided.',
      );
    }

    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Either time or timeRange must be provided.';
  }
}
