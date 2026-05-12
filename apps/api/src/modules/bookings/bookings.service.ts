import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { BookingStatus, NotificationType, Prisma } from "@prisma/client";
import { AppRole } from "../../common/decorators/roles.decorator";
import { PrismaService } from "../../common/database/prisma.service";
import { hasRequiredRole } from "../../common/rbac/role-hierarchy";
import { CancelBookingDto } from "./dto/cancel-booking.dto";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";

const MANAGER_PLUS_ROLES = [AppRole.MANAGER, AppRole.ADMIN, AppRole.SUPER_ADMIN];
const ACTIVE_BOOKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.IN_PROGRESS
];
const BUSINESS_TIMEZONE_OFFSET_MINUTES = 180;
const WORKING_HOURS_START_MINUTES = 9 * 60;
const WORKING_HOURS_END_MINUTES = 20 * 60;

const ALLOWED_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELED],
  [BookingStatus.CONFIRMED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELED],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELED]: []
};

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForClient(userId: string, dto: CreateBookingDto) {
    const [car, service] = await Promise.all([
      this.prisma.car.findFirst({
        where: {
          id: dto.carId,
          userId
        }
      }),
      this.prisma.service.findFirst({
        where: {
          id: dto.serviceId,
          isActive: true
        }
      })
    ]);

    if (!car) {
      throw new NotFoundException("Car not found.");
    }

    if (!service) {
      throw new ConflictException("Service is not available.");
    }

    const startTime = dto.scheduledAt;
    const endTime = this.calculateEndTime(startTime, service.durationMinutes);
    this.validateBookingTimeWindow(startTime, endTime);

    const existingBooking = await this.prisma.booking.findFirst({
      where: {
        scheduledAt: {
          lt: endTime
        },
        endTime: {
          gt: startTime
        },
        status: {
          in: ACTIVE_BOOKING_STATUSES
        }
      }
    });

    if (existingBooking) {
      throw new ConflictException("Booking for this time already exists.");
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdBooking = await tx.booking.create({
        data: {
          userId,
          carId: dto.carId,
          serviceId: dto.serviceId,
          scheduledAt: startTime,
          endTime,
          comment: dto.comment
        },
        include: {
          car: true,
          service: true
        }
      });

      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.BOOKING_CREATED,
          title: "Запись создана",
          message: `Создана запись #${createdBooking.id} на ${startTime.toISOString()}.`
        }
      });

      return createdBooking;
    });
  }

  async listMy(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        car: true,
        service: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async listAll() {
    return this.prisma.booking.findMany({
      include: {
        car: true,
        service: true,
        user: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async getByIdForUser(bookingId: string, userId: string, roles: AppRole[]) {
    return this.ensureBookingAccess(bookingId, userId, roles);
  }

  async getHistoryForUser(bookingId: string, userId: string, roles: AppRole[]) {
    await this.ensureBookingAccess(bookingId, userId, roles);

    return this.prisma.bookingStatusHistory.findMany({
      where: { bookingId },
      orderBy: { changedAt: "asc" },
      include: {
        changedByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async cancelByClient(bookingId: string, userId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId
      }
    });

    if (!booking) {
      throw new NotFoundException("Booking not found.");
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new ConflictException("Completed booking cannot be canceled.");
    }

    if (booking.status === BookingStatus.CANCELED) {
      throw new ConflictException("Booking is already canceled.");
    }

    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[booking.status];
    if (!allowedTransitions.includes(BookingStatus.CANCELED)) {
      throw new ConflictException("Status transition is not allowed.");
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CANCELED,
          statusComment: dto.comment
        },
        include: {
          car: true,
          service: true
        }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          changedByUserId: userId,
          fromStatus: booking.status,
          toStatus: BookingStatus.CANCELED,
          reason: dto.comment
        }
      });

      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.BOOKING_STATUS_CHANGED,
          title: "Статус записи изменен",
          message: `Запись #${bookingId}: ${booking.status} -> ${BookingStatus.CANCELED}.`
        }
      });

      return updatedBooking;
    });
  }

  async updateStatus(
    bookingId: string,
    actorUserId: string,
    actorRoles: AppRole[],
    dto: UpdateBookingStatusDto
  ) {
    if (!this.hasManagerPlusAccess(actorRoles)) {
      throw new ForbiddenException("Insufficient permissions.");
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new NotFoundException("Booking not found.");
    }

    if (booking.status === dto.status) {
      throw new ConflictException("Booking already has this status.");
    }

    const allowedTransitions = ALLOWED_STATUS_TRANSITIONS[booking.status];
    if (!allowedTransitions.includes(dto.status)) {
      throw new ConflictException("Status transition is not allowed.");
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: dto.status,
          statusComment: dto.comment
        },
        include: {
          car: true,
          service: true,
          user: true
        }
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          changedByUserId: actorUserId,
          fromStatus: booking.status,
          toStatus: dto.status,
          reason: dto.comment
        }
      });

      await tx.notification.create({
        data: {
          userId: booking.userId,
          type: NotificationType.BOOKING_STATUS_CHANGED,
          title: "Статус записи изменен",
          message: `Запись #${bookingId}: ${booking.status} -> ${dto.status}.`
        }
      });

      return updatedBooking;
    });
  }

  private hasManagerPlusAccess(roles: AppRole[]): boolean {
    return MANAGER_PLUS_ROLES.some((role) => hasRequiredRole(roles, role));
  }

  private async ensureBookingAccess(bookingId: string, userId: string, roles: AppRole[]) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        car: true,
        service: true,
        user: true
      }
    });

    if (!booking) {
      throw new NotFoundException("Booking not found.");
    }

    if (!this.hasManagerPlusAccess(roles) && booking.userId !== userId) {
      throw new NotFoundException("Booking not found.");
    }

    return booking;
  }

  private calculateEndTime(startTime: Date, durationMinutes: number): Date {
    return new Date(startTime.getTime() + durationMinutes * 60_000);
  }

  private validateBookingTimeWindow(startTime: Date, endTime: Date) {
    const now = new Date();
    if (startTime.getTime() <= now.getTime()) {
      throw new BadRequestException("Booking time must be in the future.");
    }

    if (endTime.getTime() <= startTime.getTime()) {
      throw new BadRequestException("Booking duration is invalid.");
    }

    const startMinutes = this.getBusinessMinutesOfDay(startTime);
    const endMinutes = this.getBusinessMinutesOfDay(endTime);

    const startsInWorkingHours =
      startMinutes >= WORKING_HOURS_START_MINUTES &&
      startMinutes < WORKING_HOURS_END_MINUTES;
    const endsInWorkingHours =
      endMinutes > WORKING_HOURS_START_MINUTES &&
      endMinutes <= WORKING_HOURS_END_MINUTES;

    if (!startsInWorkingHours || !endsInWorkingHours) {
      throw new BadRequestException("Booking time is outside working hours.");
    }

    if (!this.isSameBusinessDate(startTime, endTime)) {
      throw new BadRequestException("Booking must fit into a single working day.");
    }
  }

  private getBusinessMinutesOfDay(date: Date): number {
    const shifted = new Date(date.getTime() + BUSINESS_TIMEZONE_OFFSET_MINUTES * 60_000);
    return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
  }

  private isSameBusinessDate(left: Date, right: Date): boolean {
    const leftShifted = new Date(left.getTime() + BUSINESS_TIMEZONE_OFFSET_MINUTES * 60_000);
    const rightShifted = new Date(right.getTime() + BUSINESS_TIMEZONE_OFFSET_MINUTES * 60_000);

    return (
      leftShifted.getUTCFullYear() === rightShifted.getUTCFullYear() &&
      leftShifted.getUTCMonth() === rightShifted.getUTCMonth() &&
      leftShifted.getUTCDate() === rightShifted.getUTCDate()
    );
  }
}
