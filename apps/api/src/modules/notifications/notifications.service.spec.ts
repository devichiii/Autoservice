import { NotificationDeliveryStatus } from "@prisma/client";
import { NotificationsService } from "./notifications.service";

describe("NotificationsService delivery helpers", () => {
  const prisma = {
    notification: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    },
    user: {
      findUnique: jest.fn()
    }
  };

  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationsService(prisma as never);
  });

  it("listPendingForDelivery запрашивает PENDING с include user", async () => {
    prisma.notification.findMany.mockResolvedValue([] as never);
    await service.listPendingForDelivery(7);

    expect(prisma.notification.findMany).toHaveBeenCalledWith({
      where: { deliveryStatus: NotificationDeliveryStatus.PENDING },
      orderBy: { createdAt: "asc" },
      take: 7,
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
  });

  it("markAsDelivered не обновляет запись если уже DELIVERED", async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: "n1",
      deliveryStatus: NotificationDeliveryStatus.DELIVERED
    } as never);

    const result = await service.markAsDelivered("n1");

    expect(result.deliveryStatus).toBe(NotificationDeliveryStatus.DELIVERED);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });
});
