import { IsTimeOrRange } from '../validators/time-or-range.validator';

export function TimeOrRange(validationOptions?: { message?: string }) {
  return IsTimeOrRange(validationOptions);
}
