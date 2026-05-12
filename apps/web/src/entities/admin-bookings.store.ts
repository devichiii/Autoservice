import { defineStore } from "pinia";
import type { BookingStatus } from "./bookings.types";
import type { AdminBookingHistoryItem, AdminBookingItem } from "./admin-bookings.types";
import { parseApiErrorMessage } from "../shared/api-error";
import {
  getAdminBookings,
  getBookingHistory,
  updateBookingStatus
} from "../features/admin-bookings/api/admin-bookings.api";

const ALLOWED_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELED: []
};

type AdminBookingsState = {
  bookings: AdminBookingItem[];
  historyByBookingId: Record<string, AdminBookingHistoryItem[]>;
  selectedBookingId: string;
  isLoadingBookings: boolean;
  loadingHistoryForId: string;
  updatingStatusForId: string;
  error: string;
  successMessage: string;
};

export const useAdminBookingsStore = defineStore("admin-bookings", {
  state: (): AdminBookingsState => ({
    bookings: [],
    historyByBookingId: {},
    selectedBookingId: "",
    isLoadingBookings: false,
    loadingHistoryForId: "",
    updatingStatusForId: "",
    error: "",
    successMessage: ""
  }),
  actions: {
    allowedTransitions(status: BookingStatus) {
      return ALLOWED_STATUS_TRANSITIONS[status] ?? [];
    },
    async fetchBookings() {
      this.isLoadingBookings = true;
      this.error = "";
      this.successMessage = "";
      try {
        this.bookings = await getAdminBookings();
      } catch (error: unknown) {
        this.error = parseApiErrorMessage(error, "Не удалось загрузить список записей.");
      } finally {
        this.isLoadingBookings = false;
      }
    },
    async fetchHistory(bookingId: string) {
      this.loadingHistoryForId = bookingId;
      this.error = "";
      this.selectedBookingId = bookingId;
      try {
        this.historyByBookingId[bookingId] = await getBookingHistory(bookingId);
      } catch (error: unknown) {
        this.error = parseApiErrorMessage(error, "Не удалось загрузить историю записи.");
      } finally {
        this.loadingHistoryForId = "";
      }
    },
    async changeStatus(bookingId: string, status: BookingStatus, comment?: string) {
      if (this.updatingStatusForId) {
        return;
      }

      this.updatingStatusForId = bookingId;
      this.error = "";
      this.successMessage = "";
      try {
        const updated = await updateBookingStatus(bookingId, status, comment);
        this.bookings = this.bookings.map((booking) =>
          booking.id === bookingId ? { ...booking, ...updated } : booking
        );
        await this.fetchHistory(bookingId);
        this.successMessage = "Статус записи обновлен.";
      } catch (error: unknown) {
        this.error = parseApiErrorMessage(error, "Не удалось изменить статус записи.");
      } finally {
        this.updatingStatusForId = "";
      }
    }
  }
});
