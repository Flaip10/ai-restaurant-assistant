import { convertToMinutes } from './time.utils';

export function isSlotAvailable(
  reservations: { time: string; guests: number }[],
  startTime: number,
  endTime: number,
  totalSeats: number,
  guests: number,
): boolean {
  const occupiedSeats = reservations.reduce((sum, res) => {
    const resTime = convertToMinutes(res.time);
    if (resTime >= startTime && resTime < endTime) {
      return sum + res.guests;
    }
    return sum;
  }, 0);

  return occupiedSeats + guests <= totalSeats;
}

export function findNearestAvailableSlots(
  reservations: { time: string; guests: number }[],
  requestedSlot: number,
  slotDuration: number,
  totalSeats: number,
  guests: number,
  reservationDuration: number,
): number[] {
  // Calculate how many slots a reservation takes
  const slotsPerReservation = Math.ceil(reservationDuration / slotDuration);
  const availableSlots: number[] = [];

  // Check later slots
  for (let i = requestedSlot + 1; i < (24 * 60) / slotDuration; i++) {
    if (
      isSlotAvailable(
        reservations,
        i * slotDuration,
        (i + slotsPerReservation) * slotDuration,
        totalSeats,
        guests,
      )
    ) {
      availableSlots.push(i);
      break;
    }
  }

  // Check earlier slots
  for (let i = requestedSlot - 1; i >= 0; i--) {
    if (
      isSlotAvailable(
        reservations,
        i * slotDuration,
        (i + slotsPerReservation) * slotDuration,
        totalSeats,
        guests,
      )
    ) {
      availableSlots.push(i);
      break;
    }
  }

  return availableSlots;
}

export function findAvailableSlots(
  reservations: { time: string; guests: number }[],
  slotRange: { startSlot: number; endSlot: number },
  slotDuration: number,
  totalSeats: number,
  guests: number,
  reservationDuration: number,
): number[] {
  // Calculate how many slots a reservation takes
  const slotsPerReservation = Math.ceil(reservationDuration / slotDuration);
  const availableSlots: number[] = [];

  // Check available slots for the given range
  for (let i = slotRange.startSlot; i < slotRange.endSlot; i++) {
    if (
      isSlotAvailable(
        reservations,
        i * slotDuration,
        (i + slotsPerReservation) * slotDuration,
        totalSeats,
        guests,
      )
    ) {
      availableSlots.push(i);
    }
  }

  return availableSlots;
}
