/**
 * Convert time string (HH:mm) to total minutes from 00:00.
 * @param time - e.g., "20:30"
 * @returns total minutes from 00:00
 */
export function convertToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert total minutes to time string (HH:mm).
 * @param minutes - total minutes from 00:00
 * @returns formatted time string (HH:mm)
 */
export function convertToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function isValidTimeString(time: string): boolean {
  if (!time || typeof time !== 'string') return false;

  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

export function parseTimeString(timeStr: string, baseDate: Date): Date {
  if (!isValidTimeString(timeStr)) {
    throw new Error(`Invalid time string format: ${timeStr}`);
  }

  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(baseDate);

  result.setUTCHours(hours, minutes, 0, 0);
  return result;
}

export function roundToNearestHalfHour(date: Date): Date {
  const result = new Date(date);
  const minutes = result.getUTCMinutes();

  // Round to nearest 30 minutes
  const roundedMinutes = Math.round(minutes / 30) * 30;

  // If we rounded up to 60, increment the hour
  if (roundedMinutes === 60) {
    result.setUTCHours(result.getUTCHours() + 1, 0, 0, 0);
  } else {
    result.setUTCMinutes(roundedMinutes, 0, 0);
  }

  return result;
}
