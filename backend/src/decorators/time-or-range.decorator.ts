import { registerDecorator, ValidationOptions } from 'class-validator';
import { TimeOrRangeValidator } from '../validators/time-or-range.validator';

export function TimeOrRange(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: TimeOrRangeValidator,
    });
  };
}
