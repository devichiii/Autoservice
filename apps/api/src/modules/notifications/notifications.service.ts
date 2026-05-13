import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationDeliveryStatus, NotificationType } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";
import { CreateTestNotificationDto } from "./dto/create-test-notification.dto";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMy(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      throw new NotFoundException("Notification not found.");
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async createTestNotification(actorUserId: string, dto: CreateTestNotificationDto) {
    const targetUserId = dto.userId ?? actorUserId;
    return this.createSystemNotificationForUser({
      userId: targetUserId,
      type: dto.type ?? NotificationType.SYSTEM,
      title: dto.title ?? "Тестовое уведомление",
      message: dto.message ?? "Проверка базовой системы уведомлений."
    });
  }

  async createSystemNotificationForUser(input: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
  }) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true }
    });

    if (!targetUser) {
      throw new NotFoundException("User not found.");
    }

    return this.prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: input.type ?? NotificationType.SYSTEM,
        title: input.title,
        message: input.message
      }
    });
  }

  async listPendingForDelivery(limit = 20) {
    return this.prisma.notification.findMany({
      where: { deliveryStatus: NotificationDeliveryStatus.PENDING },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        user: {
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

  async markAsDelivered(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException("Notification not found.");
    }

    if (notification.deliveryStatus === NotificationDeliveryStatus.DELIVERED) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: NotificationDeliveryStatus.DELIVERED,
        deliveredAt: new Date(),
        deliveryError: null
      }
    });
  }

  async markAsFailed(notificationId: string, reason: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      throw new NotFoundException("Notification not found.");
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: NotificationDeliveryStatus.FAILED,
        deliveryError: reason
      }
    });
  }
}
