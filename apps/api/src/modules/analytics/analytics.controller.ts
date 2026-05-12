import { Controller, Get, UseGuards } from "@nestjs/common";
import { AppRole, Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AppRole.ADMIN, AppRole.SUPER_ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("dashboard")
  getDashboard() {
    return this.analyticsService.getDashboardAnalytics();
  }

  @Get("bookings")
  getBookings() {
    return this.analyticsService.getBookingsAnalytics();
  }
}
