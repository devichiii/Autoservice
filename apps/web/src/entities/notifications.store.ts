import { defineStore } from "pinia";
import type { CreateTestNotificationPayload, NotificationItem } from "./notifications.types";
import { parseApiErrorMessage } from "../shared/api-error";
import {
  createTestNotification,
  getMyNotifications,
  markNotificationAsRead
} from "../features/notifications/api/notifications.api";

type NotificationsState = {
  notifications: NotificationItem[];
  isLoading: boolean;
  markingNotificationId: string;
  isCreatingTest: boolean;
  error: string;
  actionError: string;
  successMessage: string;
};

export const useNotificationsStore = defineStore("notifications", {
  state: (): NotificationsState => ({
    notifications: [],
    isLoading: false,
    markingNotificationId: "",
    isCreatingTest: false,
    error: "",
    actionError: "",
    successMessage: ""
  }),
  getters: {
    unreadCount(state) {
      return state.notifications.filter((item) => !item.isRead).length;
    }
  },
  actions: {
    async fetchNotifications() {
      this.isLoading = true;
      this.error = "";
      try {
        this.notifications = await getMyNotifications();
      } catch (error: unknown) {
        this.error = parseApiErrorMessage(error, "Не удалось загрузить уведомления.");
      } finally {
        this.isLoading = false;
      }
    },
    async markAsRead(notificationId: string) {
      this.markingNotificationId = notificationId;
      this.actionError = "";
      this.successMessage = "";
      try {
        const updated = await markNotificationAsRead(notificationId);
        this.notifications = this.notifications.map((item) =>
          item.id === notificationId ? { ...item, ...updated } : item
        );
        this.successMessage = "Уведомление отмечено как прочитанное.";
      } catch (error: unknown) {
        this.actionError = parseApiErrorMessage(error, "Не удалось отметить уведомление как прочитанное.");
      } finally {
        this.markingNotificationId = "";
      }
    },
    async createTest(payload: CreateTestNotificationPayload) {
      this.isCreatingTest = true;
      this.actionError = "";
      this.successMessage = "";
      try {
        const created = await createTestNotification(payload);
        this.notifications = [created, ...this.notifications];
        this.successMessage = "Тестовое уведомление отправлено.";
      } catch (error: unknown) {
        this.actionError = parseApiErrorMessage(error, "Не удалось создать тестовое уведомление.");
      } finally {
        this.isCreatingTest = false;
      }
    }
  }
});
