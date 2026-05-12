import { apiClient } from "../../../shared/api-client";
import type {
  CreateTestNotificationPayload,
  NotificationItem
} from "../../../entities/notifications.types";

export async function getMyNotifications() {
  const response = await apiClient.get<NotificationItem[]>("/notifications/me");
  return response.data;
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await apiClient.patch<NotificationItem>(`/notifications/${notificationId}/read`);
  return response.data;
}

export async function createTestNotification(payload: CreateTestNotificationPayload) {
  const response = await apiClient.post<NotificationItem>("/notifications/test", payload);
  return response.data;
}
