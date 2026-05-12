import { ConflictException, NotFoundException } from "@nestjs/common";
import { ServicesService } from "./services.service";

describe("ServicesService hardening", () => {
  const prisma = {
    service: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    booking: {
      findFirst: jest.fn()
    }
  };

  let service: ServicesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServicesService(prisma as never);
  });

  it("create: сохраняет валидную услугу", async () => {
    prisma.service.create.mockResolvedValue({ id: "serviceA" });

    const result = await service.create({
      title: "Замена масла",
      description: "Тест",
      durationMinutes: 45,
      price: 2500,
      isActive: true
    });

    expect(result).toEqual({ id: "serviceA" });
    expect(prisma.service.create).toHaveBeenCalled();
  });

  it("update: возвращает 404 если услуга не найдена", async () => {
    prisma.service.findUnique.mockResolvedValue(null);

    await expect(
      service.update("missing-service", {
        title: "Новое имя"
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("delete: возвращает 409 если есть связанные bookings", async () => {
    prisma.service.findUnique.mockResolvedValue({ id: "serviceA" });
    prisma.booking.findFirst.mockResolvedValue({ id: "bookingA" });

    await expect(service.delete("serviceA")).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.service.delete).not.toHaveBeenCalled();
  });

  it("delete: удаляет услугу без bookings", async () => {
    prisma.service.findUnique.mockResolvedValue({ id: "serviceA" });
    prisma.booking.findFirst.mockResolvedValue(null);
    prisma.service.delete.mockResolvedValue({ id: "serviceA" });

    const result = await service.delete("serviceA");

    expect(result).toEqual({ success: true });
    expect(prisma.service.delete).toHaveBeenCalledWith({
      where: { id: "serviceA" }
    });
  });
});
