import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NotificationsModule } from "../../notifications/notifications.module";
import { TelegramIntegrationController } from "./telegram-integration.controller";
import { TelegramInternalKeyGuard } from "./guards/telegram-internal-key.guard";
import { TelegramIntegrationService } from "./telegram-integration.service";

@Module({
  imports: [ConfigModule, NotificationsModule],
  controllers: [TelegramIntegrationController],
  providers: [TelegramIntegrationService, TelegramInternalKeyGuard]
})
export class TelegramIntegrationModule {}
