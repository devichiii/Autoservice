import { ConflictException, NotFoundException } from "@nestjs/common";
import { CarsService } from "./cars.service";

describe("CarsService ownership regression", () => {
  const prisma = {
    car: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    booking: {
      findFirst: jest.fn()
    }
  };

  let service: CarsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CarsService(prisma as never);
  });

  it("listOwned: запрашивает только автомобили владельца", async () => {
    prisma.car.findMany.mockResolvedValue([] as never);

    await service.listOwned("clientA");

    expect(prisma.car.findMany).toHaveBeenCalledWith({
      where: { userId: "clientA" },
      orderBy: { createdAt: "desc" }
    });
  });

  it("getOwnedById: скрывает чужой автомобиль как 404", async () => {
    prisma.car.findFirst.mockResolvedValue(null as never);

    await expect(service.getOwnedById("clientA", "carB")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("deleteOwned: не дает удалить чужой автомобиль", async () => {
    prisma.car.findFirst.mockResolvedValue(null as never);

    await expect(service.deleteOwned("clientA", "carB")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("deleteOwned: возвращает controlled 409 если есть booking", async () => {
    prisma.car.findFirst.mockResolvedValueOnce({
      id: "carA",
      userId: "clientA"
    } as never);
    prisma.booking.findFirst.mockResolvedValue({ id: "bookingA" } as never);

    await expect(service.deleteOwned("clientA", "carA")).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.car.delete).not.toHaveBeenCalled();
  });

  it("deleteOwned: удаляет собственный автомобиль без booking", async () => {
    prisma.car.findFirst.mockResolvedValueOnce({
      id: "carA",
      userId: "clientA"
    } as never);
    prisma.booking.findFirst.mockResolvedValue(null as never);
    prisma.car.delete.mockResolvedValue({ id: "carA" } as never);

    const result = await service.deleteOwned("clientA", "carA");

    expect(result).toEqual({ id: "carA" });
    expect(prisma.car.delete).toHaveBeenCalledWith({ where: { id: "carA" } });
  });
});
