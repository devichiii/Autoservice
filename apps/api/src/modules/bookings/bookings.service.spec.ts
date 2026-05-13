import {
  ForbiddenException,
  NotFoundException
} from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { AppRole } from "../../common/decorators/roles.decorator";
import { BookingsService } from "./bookings.service";

describe("BookingsService ownership and RBAC regression", () => {
  const prisma = {
    car: {
      findFirst: jest.fn()
    },
    service: {
      findFirst: jest.fn()
    },
    booking: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn()
    },
    bookingStatusHistory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn()
    },
    notification: {
      create: jest.fn()
    },
    $transaction: jest.fn()
  };

  let service: BookingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BookingsService(prisma as never);
  });

  it("createForClient: не позволяет создать booking с чужим carId", async () => {
    prisma.car.findFirst.mockResolvedValue(null as never);
    prisma.service.findFirst.mockResolvedValue({
      id: "serviceA",
      durationMinutes: 60,
      isActive: true
    } as never);

    await expect(
      service.createForClient("clientA", {
        carId: "carB",
        serviceId: "serviceA",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60_000)
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("listMy: запрашивает только свои booking", async () => {
    prisma.booking.findMany.mockResolvedValue([] as never);

    await service.listMy("clientA");

    expect(prisma.booking.findMany).toHaveBeenCalledWith({
      where: { userId: "clientA" },
      include: { car: true, service: true },
      orderBy: { createdAt: "desc" }
    });
  });

  it("getByIdForUser: CLIENT не видит booking другого пользователя", async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: "bookingB",
      userId: "clientB"
    } as never);

    await expect(
      service.getByIdForUser("bookingB", "clientA", [AppRole.CLIENT])
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("updateStatus: CLIENT не может менять статус", async () => {
    await expect(
      service.updateStatus(
        "bookingA",
        "clientA",
        [AppRole.CLIENT],
        { status: BookingStatus.CONFIRMED }
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("updateStatus: ADMIN может менять статус booking", async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: "bookingA",
      userId: "clientA",
      status: BookingStatus.PENDING
    } as never);

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        booking: {
          update: jest.fn().mockResolvedValue({
            id: "bookingA",
            status: BookingStatus.CONFIRMED,
            scheduledAt: new Date("2026-06-02T09:00:00.000Z"),
            service: { title: "Test service" },
            car: { brand: "VW", model: "Golf" }
          })
        },
        bookingStatusHistory: {
          create: jest.fn().mockResolvedValue({})
        },
        notification: {
          create: jest.fn().mockResolvedValue({})
        }
      };
      return callback(tx);
    });

    const result = await service.updateStatus(
      "bookingA",
      "adminA",
      [AppRole.ADMIN],
      { status: BookingStatus.CONFIRMED, comment: "Approved by admin" }
    );

    expect(result).toMatchObject({
      id: "bookingA",
      status: BookingStatus.CONFIRMED
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
