import { apiClient } from "../../../shared/api-client";
import type { BookingStatus } from "../../../entities/bookings.types";
import type { AdminBookingHistoryItem, AdminBookingItem } from "../../../entities/admin-bookings.types";

export async function getAdminBookings() {
  const response = await apiClient.get<AdminBookingItem[]>("/bookings");
  return response.data;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  comment?: string
) {
  const response = await apiClient.patch<AdminBookingItem>(`/bookings/${bookingId}/status`, {
    status,
    comment
  });
  return response.data;
}

export async function getBookingHistory(bookingId: string) {
  const response = await apiClient.get<AdminBookingHistoryItem[]>(`/bookings/${bookingId}/history`);
  return response.data;
}
