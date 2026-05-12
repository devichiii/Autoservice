import { defineStore } from "pinia";
import { parseApiErrorMessage } from "../shared/api-error";
import {
  cancelBooking,
  createBooking,
  getAvailableSlots,
  getCarsMy,
  getMyBookings,
  getServices
} from "../features/bookings/api/bookings.api";
import type { BookingItem, CarItem, CreateBookingPayload, ScheduleSlot, ServiceItem } from "./bookings.types";

type BookingsState = {
  services: ServiceItem[];
  cars: CarItem[];
  slots: ScheduleSlot[];
  myBookings: BookingItem[];
  isLoadingServices: boolean;
  isLoadingCars: boolean;
  isLoadingSlots: boolean;
  isLoadingBookings: boolean;
  isCreatingBooking: boolean;
  cancelingBookingId: string | null;
  servicesError: string;
  carsError: string;
  slotsError: string;
  bookingsError: string;
  createError: string;
};

export const useBookingsStore = defineStore("bookings", {
  state: (): BookingsState => ({
    services: [],
    cars: [],
    slots: [],
    myBookings: [],
    isLoadingServices: false,
    isLoadingCars: false,
    isLoadingSlots: false,
    isLoadingBookings: false,
    isCreatingBooking: false,
    cancelingBookingId: null,
    servicesError: "",
    carsError: "",
    slotsError: "",
    bookingsError: "",
    createError: ""
  }),
  actions: {
    async fetchServices() {
      this.isLoadingServices = true;
      this.servicesError = "";
      try {
        this.services = await getServices();
      } catch (error: unknown) {
        this.servicesError = parseApiErrorMessage(error, "Не удалось загрузить услуги.");
      } finally {
        this.isLoadingServices = false;
      }
    },

    async fetchCars() {
      this.isLoadingCars = true;
      this.carsError = "";
      try {
        this.cars = await getCarsMy();
      } catch (error: unknown) {
        this.carsError = parseApiErrorMessage(error, "Не удалось загрузить машины.");
      } finally {
        this.isLoadingCars = false;
      }
    },

    async fetchSlots(date: string, serviceId: string) {
      this.isLoadingSlots = true;
      this.slotsError = "";
      this.slots = [];
      try {
        const data = await getAvailableSlots(date, serviceId);
        this.slots = data.slots;
      } catch (error: unknown) {
        this.slotsError = parseApiErrorMessage(error, "Не удалось загрузить свободные интервалы.");
      } finally {
        this.isLoadingSlots = false;
      }
    },

    clearSlots() {
      this.slots = [];
      this.slotsError = "";
    },

    async fetchMyBookings() {
      this.isLoadingBookings = true;
      this.bookingsError = "";
      try {
        this.myBookings = await getMyBookings();
      } catch (error: unknown) {
        this.bookingsError = parseApiErrorMessage(error, "Не удалось загрузить записи.");
      } finally {
        this.isLoadingBookings = false;
      }
    },

    async createBooking(payload: CreateBookingPayload) {
      this.isCreatingBooking = true;
      this.createError = "";
      try {
        const created = await createBooking(payload);
        this.myBookings = [created, ...this.myBookings];
        return created;
      } catch (error: unknown) {
        this.createError = parseApiErrorMessage(error, "Не удалось создать запись.");
        throw error;
      } finally {
        this.isCreatingBooking = false;
      }
    },

    async cancelBooking(bookingId: string, comment?: string) {
      this.cancelingBookingId = bookingId;
      this.bookingsError = "";
      try {
        const updated = await cancelBooking(bookingId, comment);
        this.myBookings = this.myBookings.map((booking) =>
          booking.id === bookingId ? { ...booking, ...updated } : booking
        );
      } catch (error: unknown) {
        this.bookingsError = parseApiErrorMessage(error, "Не удалось отменить запись.");
      } finally {
        this.cancelingBookingId = null;
      }
    }
  }
});
