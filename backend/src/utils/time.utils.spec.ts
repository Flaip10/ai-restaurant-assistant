import {
  convertToMinutes,
  convertToTime,
  isValidTimeString,
  parseTimeString,
  roundToNearestHalfHour,
} from './time.utils';

describe('Time Utils', () => {
  describe('convertToMinutes', () => {
    it('should convert time string to minutes', () => {
      expect(convertToMinutes('00:00')).toBe(0);
      expect(convertToMinutes('01:30')).toBe(90);
      expect(convertToMinutes('12:45')).toBe(765);
      expect(convertToMinutes('23:59')).toBe(1439);
    });

    it('should handle single-digit hours and minutes', () => {
      expect(convertToMinutes('1:30')).toBe(90);
      expect(convertToMinutes('12:5')).toBe(725);
    });
  });

  describe('convertToTime', () => {
    it('should convert minutes to time string', () => {
      expect(convertToTime(0)).toBe('00:00');
      expect(convertToTime(90)).toBe('01:30');
      expect(convertToTime(765)).toBe('12:45');
      expect(convertToTime(1439)).toBe('23:59');
    });

    it('should pad hours and minutes with leading zeros', () => {
      expect(convertToTime(5)).toBe('00:05');
      expect(convertToTime(65)).toBe('01:05');
    });
  });

  describe('isValidTimeString', () => {
    it('should return true for valid time strings', () => {
      expect(isValidTimeString('00:00')).toBe(true);
      expect(isValidTimeString('12:30')).toBe(true);
      expect(isValidTimeString('23:59')).toBe(true);
    });

    it('should return false for invalid time strings', () => {
      expect(isValidTimeString('24:00')).toBe(false);
      expect(isValidTimeString('12:60')).toBe(false);
      expect(isValidTimeString('1:30')).toBe(false);
      expect(isValidTimeString('invalid')).toBe(false);
      expect(isValidTimeString('')).toBe(false);
      expect(isValidTimeString(null as unknown as string)).toBe(false);
      expect(isValidTimeString(undefined as unknown as string)).toBe(false);
    });
  });

  describe('parseTimeString', () => {
    const baseDate = new Date('2024-03-20T00:00:00.000Z');

    it('should parse valid time strings correctly', () => {
      const result = parseTimeString('14:30', baseDate);
      expect(result.getUTCHours()).toBe(14);
      expect(result.getUTCMinutes()).toBe(30);
      expect(result.getUTCDate()).toBe(baseDate.getUTCDate());
      expect(result.getUTCMonth()).toBe(baseDate.getUTCMonth());
      expect(result.getUTCFullYear()).toBe(baseDate.getUTCFullYear());
    });

    it('should throw error for invalid time strings', () => {
      const invalidTimes = ['25:00', '12:60', '1:30', 'invalid', ''];

      invalidTimes.forEach((time) => {
        expect(() => parseTimeString(time, baseDate)).toThrow(
          'Invalid time string format',
        );
      });
    });

    it('should preserve the base date while setting time', () => {
      const customDate = new Date('2024-12-25T00:00:00.000Z');
      const result = parseTimeString('15:45', customDate);

      expect(result.getUTCHours()).toBe(15);
      expect(result.getUTCMinutes()).toBe(45);
      expect(result.getUTCDate()).toBe(25);
      expect(result.getUTCMonth()).toBe(11); // December is 11 in zero-based months
      expect(result.getUTCFullYear()).toBe(2024);
    });
  });

  describe('roundToNearestHalfHour', () => {
    it('should round times to nearest half hour', () => {
      const testCases = [
        { input: '14:10', expected: '14:00' },
        { input: '14:20', expected: '14:30' },
        { input: '14:40', expected: '14:30' },
        { input: '14:50', expected: '15:00' },
        { input: '23:50', expected: '00:00' }, // Should roll over to next day
      ];

      testCases.forEach(({ input, expected }) => {
        const baseDate = new Date('2024-03-20T00:00:00.000Z');
        const inputDate = parseTimeString(input, baseDate);
        const expectedDate = parseTimeString(
          expected,
          expected === '00:00'
            ? new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
            : baseDate,
        );

        const result = roundToNearestHalfHour(inputDate);

        expect(result.getUTCHours()).toBe(expectedDate.getUTCHours());
        expect(result.getUTCMinutes()).toBe(expectedDate.getUTCMinutes());
      });
    });

    it('should preserve the date while rounding', () => {
      const baseDate = new Date('2024-12-25T14:20:00.000Z');
      const result = roundToNearestHalfHour(baseDate);

      expect(result.getUTCDate()).toBe(25);
      expect(result.getUTCMonth()).toBe(11); // December is 11 in zero-based months
      expect(result.getUTCFullYear()).toBe(2024);
    });
  });
});
