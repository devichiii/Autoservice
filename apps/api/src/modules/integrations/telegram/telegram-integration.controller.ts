import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { TelegramNotifyDto } from "./dto/telegram-notify.dto";
import { TelegramTestDto } from "./dto/telegram-test.dto";
import { TelegramInternalKeyGuard } from "./guards/telegram-internal-key.guard";
import { TelegramIntegrationService } from "./telegram-integration.service";

@Controller("integrations/telegram")
@UseGuards(TelegramInternalKeyGuard)
export class TelegramIntegrationController {
  constructor(private readonly telegramIntegrationService: TelegramIntegrationService) {}

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
  listPending(
    @Query("limit", new ParseIntPipe({ optional: true })) limit?: number
  ) {
    return this.telegramIntegrationService.listPendingNotifications(limit ?? 20);
  }

  @Patch("notifications/:id/delivered")
  markDelivered(@Param("id") notificationId: string) {
    return this.telegramIntegrationService.markNotificationDelivered(notificationId);
  }
}
