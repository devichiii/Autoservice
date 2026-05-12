import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./common/database/prisma.module";
import appConfig from "./config/app.config";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuditLogModule } from "./modules/audit-log/audit-log.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { CarsModule } from "./modules/cars/cars.module";
import { TelegramIntegrationModule } from "./modules/integrations/telegram/telegram-integration.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { RolesModule } from "./modules/roles/roles.module";
import { ScheduleModule } from "./modules/schedule/schedule.module";
import { ServicesModule } from "./modules/services/services.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig]
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    CarsModule,
    TelegramIntegrationModule,
    ServicesModule,
    ScheduleModule,
    BookingsModule,
    NotificationsModule,
    AnalyticsModule,
    AuditLogModule
  ]
})
export class AppModule {}
