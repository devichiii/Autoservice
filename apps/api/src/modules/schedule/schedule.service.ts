import { ConflictException, Injectable } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";

const BUSINESS_TIMEZONE_OFFSET_MINUTES = 180;
const WORKING_HOURS_START_MINUTES = 9 * 60;
const WORKING_HOURS_END_MINUTES = 20 * 60;
const SLOT_STEP_MINUTES = 30;
const ACTIVE_BOOKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS
];

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableSlots(date: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        isActive: true
      }
    });

    if (!service) {
      throw new ConflictException("Service is not available.");
    }

    const dayStart = this.toUtcFromBusinessDate(date, WORKING_HOURS_START_MINUTES);
    const dayEnd = this.toUtcFromBusinessDate(date, WORKING_HOURS_END_MINUTES);

    const existingBookings = await this.prisma.booking.findMany({
      where: {
        status: {
          in: ACTIVE_BOOKING_STATUSES
        },
        scheduledAt: {
          lt: dayEnd
        },
        endTime: {
          gt: dayStart
        }
      },
      select: {
        scheduledAt: true,
        endTime: true
      }
    });

    const availableSlots: Array<{ startsAt: string; endsAt: string }> = [];
    const slotDurationMs = service.durationMinutes * 60_000;
    const stepMs = SLOT_STEP_MINUTES * 60_000;
    const latestStartMs = dayEnd.getTime() - slotDurationMs;

    for (let startMs = dayStart.getTime(); startMs <= latestStartMs; startMs += stepMs) {
      const start = new Date(startMs);
      const end = new Date(startMs + slotDurationMs);
      const hasOverlap = existingBookings.some(
        (booking) => booking.scheduledAt < end && booking.endTime > start
      );

      if (!hasOverlap) {
        availableSlots.push({
          startsAt: start.toISOString(),
          endsAt: end.toISOString()
        });
      }
    }

    return {
      date,
      serviceId,
      durationMinutes: service.durationMinutes,
      workingHours: {
        startsAt: dayStart.toISOString(),
        endsAt: dayEnd.toISOString()
      },
      slots: availableSlots
    };
  }

  private toUtcFromBusinessDate(date: string, minutesOfDay: number): Date {
    const [yearString, monthString, dayString] = date.split("-");
    const year = Number(yearString);
    const month = Number(monthString);
    const day = Number(dayString);
    const hour = Math.floor(minutesOfDay / 60);
    const minute = minutesOfDay % 60;
    const utcMs =
      Date.UTC(year, month - 1, day, hour, minute, 0, 0) -
      BUSINESS_TIMEZONE_OFFSET_MINUTES * 60_000;
    return new Date(utcMs);
  }
}
