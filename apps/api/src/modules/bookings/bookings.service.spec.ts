import {
  ConflictException,
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
            status: BookingStatus.CONFIRMED
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

    expect(result).toEqual({
      id: "bookingA",
      status: BookingStatus.CONFIRMED
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("updateStatus: запрещённый переход COMPLETED -> CONFIRMED не открывает транзакцию", async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: "bookingA",
      userId: "clientA",
      status: BookingStatus.COMPLETED
    } as never);

    await expect(
      service.updateStatus("bookingA", "adminA", [AppRole.ADMIN], {
        status: BookingStatus.CONFIRMED
      })
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("updateStatus: запрещённый переход PENDING -> COMPLETED без записи в истории", async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: "bookingA",
      userId: "clientA",
      status: BookingStatus.PENDING
    } as never);

    await expect(
      service.updateStatus("bookingA", "adminA", [AppRole.SUPER_ADMIN], {
        status: BookingStatus.COMPLETED
      })
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("updateStatus: CONFIRMED -> IN_PROGRESS и IN_PROGRESS -> COMPLETED (админ)", async () => {
    prisma.booking.findUnique.mockResolvedValueOnce({
      id: "bookingA",
      userId: "clientA",
      status: BookingStatus.CONFIRMED
    } as never);

    prisma.$transaction.mockImplementationOnce(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        booking: {
          update: jest.fn().mockResolvedValue({
            id: "bookingA",
            status: BookingStatus.IN_PROGRESS
          })
        },
        bookingStatusHistory: { create: jest.fn() },
        notification: { create: jest.fn() }
      };
      return callback(tx);
    });

    await service.updateStatus("bookingA", "adminA", [AppRole.ADMIN], {
      status: BookingStatus.IN_PROGRESS
    });

    prisma.booking.findUnique.mockResolvedValueOnce({
      id: "bookingA",
      userId: "clientA",
      status: BookingStatus.IN_PROGRESS
    } as never);

    prisma.$transaction.mockImplementationOnce(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        booking: {
          update: jest.fn().mockResolvedValue({
            id: "bookingA",
            status: BookingStatus.COMPLETED
          })
        },
        bookingStatusHistory: { create: jest.fn() },
        notification: { create: jest.fn() }
      };
      return callback(tx);
    });

    const done = await service.updateStatus("bookingA", "adminA", [AppRole.ADMIN], {
      status: BookingStatus.COMPLETED
    });

    expect(done.status).toBe(BookingStatus.COMPLETED);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it("updateStatus: MANAGER может подтвердить PENDING запись", async () => {
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
            status: BookingStatus.CONFIRMED
          })
        },
        bookingStatusHistory: { create: jest.fn() },
        notification: { create: jest.fn() }
      };
      return callback(tx);
    });

    const result = await service.updateStatus("bookingA", "mgrA", [AppRole.MANAGER], {
      status: BookingStatus.CONFIRMED
    });

    expect(result.status).toBe(BookingStatus.CONFIRMED);
  });

  it("cancelByClient: нельзя отменить IN_PROGRESS", async () => {
    prisma.booking.findFirst.mockResolvedValue({
      id: "bookingA",
      userId: "clientA",
      status: BookingStatus.IN_PROGRESS
    } as never);

    await expect(
      service.cancelByClient("bookingA", "clientA", { comment: "x" })
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("cancelByClient: отмена PENDING создаёт транзакцию", async () => {
    prisma.booking.findFirst.mockResolvedValue({
      id: "bookingA",
      userId: "clientA",
      status: BookingStatus.PENDING
    } as never);

    prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        booking: {
          update: jest.fn().mockResolvedValue({
            id: "bookingA",
            status: BookingStatus.CANCELED
          })
        },
        bookingStatusHistory: { create: jest.fn() },
        notification: { create: jest.fn() }
      };
      return callback(tx);
    });

    const updated = await service.cancelByClient("bookingA", "clientA", {});

    expect(updated.status).toBe(BookingStatus.CANCELED);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
