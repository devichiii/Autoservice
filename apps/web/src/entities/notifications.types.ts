export type NotificationType = "BOOKING_CREATED" | "BOOKING_STATUS_CHANGED" | "SYSTEM";

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateTestNotificationPayload = {
  title?: string;
  message?: string;
  type?: NotificationType;
  userId?: string;
};
