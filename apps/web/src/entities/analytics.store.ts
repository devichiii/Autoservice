import { defineStore } from "pinia";
import type { BookingsAnalytics, DashboardAnalytics } from "./analytics.types";
import { parseApiErrorMessage } from "../shared/api-error";
import {
  fetchBookingsAnalyticsApi,
  fetchDashboardAnalyticsApi
} from "../features/analytics/api/analytics.api";

type AnalyticsState = {
  dashboard: DashboardAnalytics | null;
  bookings: BookingsAnalytics | null;
  isLoadingDashboard: boolean;
  isLoadingBookings: boolean;
  dashboardError: string;
  bookingsError: string;
};

export const useAnalyticsStore = defineStore("analytics", {
  state: (): AnalyticsState => ({
    dashboard: null,
    bookings: null,
    isLoadingDashboard: false,
    isLoadingBookings: false,
    dashboardError: "",
    bookingsError: ""
  }),
  actions: {
    async fetchDashboardAnalytics() {
      this.isLoadingDashboard = true;
      this.dashboardError = "";
      try {
        this.dashboard = await fetchDashboardAnalyticsApi();
      } catch (error: unknown) {
        this.dashboardError = parseApiErrorMessage(
          error,
          "Не удалось загрузить dashboard analytics."
        );
      } finally {
        this.isLoadingDashboard = false;
      }
    },
    async fetchBookingsAnalytics() {
      this.isLoadingBookings = true;
      this.bookingsError = "";
      try {
        this.bookings = await fetchBookingsAnalyticsApi();
      } catch (error: unknown) {
        this.bookingsError = parseApiErrorMessage(error, "Не удалось загрузить bookings analytics.");
      } finally {
        this.isLoadingBookings = false;
      }
    }
  }
});
