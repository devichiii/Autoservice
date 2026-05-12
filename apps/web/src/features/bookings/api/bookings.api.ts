import { apiClient } from "../../../shared/api-client";
import type {
  BookingItem,
  CarItem,
  CreateBookingPayload,
  ScheduleResponse,
  ServiceItem
} from "../../../entities/bookings.types";

export async function getServices() {
  const response = await apiClient.get<ServiceItem[]>("/services");
  return response.data;
}

export async function getCarsMy() {
  const response = await apiClient.get<CarItem[]>("/cars/my");
  return response.data;
}

export async function getAvailableSlots(date: string, serviceId: string) {
  const response = await apiClient.get<ScheduleResponse>("/schedule/available-slots", {
    params: { date, serviceId }
  });
  return response.data;
}

export async function createBooking(payload: CreateBookingPayload) {
  const response = await apiClient.post<BookingItem>("/bookings", payload);
  return response.data;
}

export async function getMyBookings() {
  const response = await apiClient.get<BookingItem[]>("/bookings/my");
  return response.data;
}

export async function cancelBooking(bookingId: string, comment?: string) {
  const response = await apiClient.patch<BookingItem>(`/bookings/${bookingId}/cancel`, {
    comment
  });
  return response.data;
}
