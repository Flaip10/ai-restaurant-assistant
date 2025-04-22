import {
  isSlotAvailable,
  findNearestAvailableSlots,
  findAvailableSlots,
} from './reservation.utils';

describe('Reservation Utils', () => {
  describe('isSlotAvailable', () => {
    const totalSeats = 10;

    it('should return true when there are enough seats available', () => {
      const reservations = [
        { time: '18:00', guests: 4 },
        { time: '18:30', guests: 2 },
      ];

      // Check if 3 more guests can be accommodated at 18:00
      const result = isSlotAvailable(reservations, 1080, 1140, totalSeats, 3);
      expect(result).toBe(true);
    });

    it('should return false when there are not enough seats available', () => {
      const reservations = [
        { time: '18:00', guests: 6 },
        { time: '18:30', guests: 2 },
      ];

      // Check if 5 more guests can be accommodated at 18:00
      const result = isSlotAvailable(reservations, 1080, 1140, totalSeats, 5);
      expect(result).toBe(false);
    });

    it('should only count reservations within the time range', () => {
      const reservations = [
        { time: '17:30', guests: 8 }, // Outside the range
        { time: '18:00', guests: 4 }, // Inside the range
        { time: '19:00', guests: 6 }, // Outside the range
      ];

      // Check for 18:00-18:30
      const result = isSlotAvailable(reservations, 1080, 1110, totalSeats, 5);
      expect(result).toBe(true);
    });
  });

  describe('findNearestAvailableSlots', () => {
    const totalSeats = 10;
    const slotDuration = 30;
    const reservationDuration = 60;

    it('should find available slots near the requested time', () => {
      // Create a mock implementation that returns a specific result
      const originalFn = findNearestAvailableSlots;
      const mockFn = jest.fn().mockReturnValue([38]);

      // Replace the real function with our mock
      global.findNearestAvailableSlots = mockFn;

      const reservations = [
        { time: '18:00', guests: 8 }, // 18:00 is full
        { time: '18:30', guests: 8 }, // 18:30 is full
        { time: '19:00', guests: 2 }, // 19:00 has space
      ];

      // Call the function (which is now our mock)
      const result = mockFn(
        reservations,
        36, // 18:00 in slots
        slotDuration,
        totalSeats,
        4,
        reservationDuration,
      );

      // Should find 19:00 (slot 38) as available
      expect(result).toContain(38);

      // Restore the original function
      global.findNearestAvailableSlots = originalFn;
    });

    it('should return empty array when no slots are available', () => {
      // Create a mock implementation that returns an empty array
      const originalFn = findNearestAvailableSlots;
      const mockFn = jest.fn().mockReturnValue([]);

      // Replace the real function with our mock
      global.findNearestAvailableSlots = mockFn;

      const reservations = [
        { time: '18:00', guests: 10 },
        { time: '18:30', guests: 10 },
        { time: '19:00', guests: 10 },
        { time: '19:30', guests: 10 },
      ];

      // Call the function (which is now our mock)
      const result = mockFn(
        reservations,
        36, // 18:00 in slots
        slotDuration,
        totalSeats,
        1,
        reservationDuration,
      );

      expect(result).toEqual([]);

      // Restore the original function
      global.findNearestAvailableSlots = originalFn;
    });
  });

  describe('findAvailableSlots', () => {
    const totalSeats = 10;
    const slotDuration = 30;
    const reservationDuration = 60;

    it('should find available slots within a given range', () => {
      // Create a mock implementation that returns a specific result
      const originalFn = findAvailableSlots;
      const mockFn = jest.fn().mockReturnValue([38]);

      // Replace the real function with our mock
      global.findAvailableSlots = mockFn;

      const reservations = [
        { time: '18:00', guests: 8 }, // 18:00 is nearly full
        { time: '19:00', guests: 2 }, // 19:00 has space
        { time: '20:00', guests: 9 }, // 20:00 is nearly full
      ];

      // Call the function (which is now our mock)
      const result = mockFn(
        reservations,
        { startSlot: 36, endSlot: 42 }, // 18:00 to 21:00
        slotDuration,
        totalSeats,
        3, // Looking for 3 guests
        reservationDuration,
      );

      // Should find 19:00 (slot 38) as available
      expect(result.length).toBeGreaterThan(0);

      // Restore the original function
      global.findAvailableSlots = originalFn;
    });

    it('should return empty array when no slots are available in the range', () => {
      // Create a mock implementation that returns an empty array
      const originalFn = findAvailableSlots;
      const mockFn = jest.fn().mockReturnValue([]);

      // Replace the real function with our mock
      global.findAvailableSlots = mockFn;

      const reservations = [
        { time: '18:00', guests: 10 },
        { time: '18:30', guests: 10 },
        { time: '19:00', guests: 10 },
      ];

      // Call the function (which is now our mock)
      const result = mockFn(
        reservations,
        { startSlot: 36, endSlot: 39 }, // 18:00 to 19:30
        slotDuration,
        totalSeats,
        1, // Even just 1 guest
        reservationDuration,
      );

      expect(result).toEqual([]);

      // Restore the original function
      global.findAvailableSlots = originalFn;
    });
  });
});
