import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";

type CreateCarInput = {
  brand: string;
  model: string;
  year?: number;
  vin?: string;
  plateNumber?: string;
  notes?: string;
};

type UpdateCarInput = Partial<CreateCarInput>;

@Injectable()
export class CarsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForOwner(ownerId: string, input: CreateCarInput) {
    return await this.prisma.car.create({
      data: {
        userId: ownerId,
        brand: input.brand,
        model: input.model,
        year: input.year,
        vin: input.vin,
        plateNumber: input.plateNumber,
        notes: input.notes
      }
    });
  }

  async listOwned(ownerId: string) {
    return await this.prisma.car.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: "desc" }
    });
  }

  async getOwnedById(ownerId: string, carId: string) {
    const car = await this.prisma.car.findFirst({
      where: {
        id: carId,
        userId: ownerId
      }
    });

    if (!car) {
      throw new NotFoundException("Car not found.");
    }

    return car;
  }

  async updateOwned(ownerId: string, carId: string, input: UpdateCarInput) {
    await this.getOwnedById(ownerId, carId);

    return await this.prisma.car.update({
      where: { id: carId },
      data: {
        brand: input.brand,
        model: input.model,
        year: input.year,
        vin: input.vin,
        plateNumber: input.plateNumber,
        notes: input.notes
      }
    });
  }

  async deleteOwned(ownerId: string, carId: string) {
    await this.getOwnedById(ownerId, carId);

    const bookingExists = await this.prisma.booking.findFirst({
      where: { carId },
      select: { id: true }
    });

    if (bookingExists) {
      throw new ConflictException(
        "Нельзя удалить автомобиль, потому что по нему есть записи на обслуживание."
      );
    }

    try {
      return await this.prisma.car.delete({
        where: { id: carId }
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictException(
          "Нельзя удалить автомобиль, потому что по нему есть записи на обслуживание."
        );
      }
      throw error;
    }
  }
}
