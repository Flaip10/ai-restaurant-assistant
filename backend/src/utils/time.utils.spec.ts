import { convertToMinutes, convertToTime } from './time.utils';

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
});
