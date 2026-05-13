import type { BookingItem, BookingStatus } from "./bookings.types";

export type AdminBookingUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type AdminBookingItem = BookingItem & {
  user?: AdminBookingUser;
};

export type AdminBookingHistoryItem = {
  id: string;
  bookingId: string;
  changedByUserId: string;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  reason: string | null;
  changedAt: string;
  changedByUser?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};
