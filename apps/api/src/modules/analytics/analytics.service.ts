import { Injectable } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardAnalytics() {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      canceledBookings,
      totalUsers,
      totalServices
    ] = await this.prisma.$transaction([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.booking.count({ where: { status: BookingStatus.CANCELED } }),
      this.prisma.user.count(),
      this.prisma.service.count()
    ]);

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      canceledBookings,
      totalUsers,
      totalServices
    };
  }

  async getBookingsAnalytics() {
    const groups = await this.prisma.booking.groupBy({
      by: ["status"],
      _count: {
        _all: true
      }
    });

    const byStatus: Record<BookingStatus, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELED: 0
    };

    for (const group of groups) {
      byStatus[group.status] = group._count._all;
    }

    return {
      totalBookings: Object.values(byStatus).reduce((acc, value) => acc + value, 0),
      byStatus
    };
  }
}
