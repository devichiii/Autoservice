import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { TelegramDeliveryFailedDto } from "./dto/telegram-delivery-failed.dto";
import { TelegramNotifyDto } from "./dto/telegram-notify.dto";
import { TelegramTestDto } from "./dto/telegram-test.dto";
import { TelegramInternalKeyGuard } from "./guards/telegram-internal-key.guard";
import { TelegramIntegrationService } from "./telegram-integration.service";

@Controller("integrations/telegram")
@UseGuards(TelegramInternalKeyGuard)
export class TelegramIntegrationController {
  constructor(private readonly telegramIntegrationService: TelegramIntegrationService) {}

  private static parseLimit(limitRaw?: string, fallback = 20): number {
    if (!limitRaw) {
      return fallback;
    }

    const n = Number.parseInt(limitRaw, 10);
    if (Number.isNaN(n) || n < 1) {
      return fallback;
    }

    return Math.min(n, 100);
  }

  @Get("health")
  health() {
    return this.telegramIntegrationService.healthCheck();
  }

  @Post("test")
  createTestEvent(@Body() dto: TelegramTestDto) {
    return this.telegramIntegrationService.createTestEvent(dto);
  }

  @Post("notify")
  notify(@Body() dto: TelegramNotifyDto) {
    return this.telegramIntegrationService.notify(dto);
  }

  @Get("pending")
  listPending(@Query("limit") limitRaw?: string) {
    const limit = TelegramIntegrationController.parseLimit(limitRaw);
    return this.telegramIntegrationService.listPendingNotifications(limit);
  }

  @Patch("notifications/:id/delivered")
  markDelivered(@Param("id") notificationId: string) {
    return this.telegramIntegrationService.markNotificationDelivered(notificationId);
  }

  @Patch("notifications/:id/failed")
  markDeliveryFailed(@Param("id") notificationId: string, @Body() dto: TelegramDeliveryFailedDto) {
    return this.telegramIntegrationService.markNotificationDeliveryFailed(notificationId, dto.reason);
  }
}
