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
