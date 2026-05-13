import { Injectable } from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { NotificationsService } from "../../notifications/notifications.service";
import { TelegramNotifyDto } from "./dto/telegram-notify.dto";
import { TelegramTestDto } from "./dto/telegram-test.dto";

@Injectable()
export class TelegramIntegrationService {
  constructor(private readonly notificationsService: NotificationsService) {}

  healthCheck() {
    return {
      ok: true,
      integration: "telegram",
      mode: "internal-api"
    };
  }

  createTestEvent(dto: TelegramTestDto) {
    return this.notificationsService.createSystemNotificationForUser({
      userId: dto.userId,
      type: dto.type ?? NotificationType.SYSTEM,
      title: dto.title ?? "Telegram test event",
      message: dto.message ?? "Проверка интеграционного слоя Telegram -> backend API."
    });
  }

  notify(dto: TelegramNotifyDto) {
    return this.notificationsService.createSystemNotificationForUser({
      userId: dto.userId,
      type: dto.type ?? NotificationType.SYSTEM,
      title: dto.title,
      message: dto.message
    });
  }

  listPendingNotifications(limit = 20) {
    return this.notificationsService.listPendingForDelivery(limit);
  }

  markNotificationDelivered(notificationId: string) {
    return this.notificationsService.markAsDelivered(notificationId);
  }

  markNotificationDeliveryFailed(notificationId: string, reason: string) {
    return this.notificationsService.markAsFailed(notificationId, reason);
  }
}
