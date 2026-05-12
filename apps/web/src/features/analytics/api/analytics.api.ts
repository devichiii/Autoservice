import { apiClient } from "../../../shared/api-client";
import type { BookingsAnalytics, DashboardAnalytics } from "../../../entities/analytics.types";

export async function fetchDashboardAnalyticsApi() {
  const response = await apiClient.get<DashboardAnalytics>("/analytics/dashboard");
  return response.data;
}

export async function fetchBookingsAnalyticsApi() {
  const response = await apiClient.get<BookingsAnalytics>("/analytics/bookings");
  return response.data;
}
