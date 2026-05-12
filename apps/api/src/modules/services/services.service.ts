import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common/database/prisma.service";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async getActiveById(serviceId: string) {
    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        isActive: true
      }
    });

    if (!service) {
      throw new NotFoundException("Service not found.");
    }

    return service;
  }

  async create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        durationMinutes: dto.durationMinutes,
        isActive: dto.isActive ?? true
      }
    });
  }

  async update(serviceId: string, dto: UpdateServiceDto) {
    await this.ensureExists(serviceId);

    return this.prisma.service.update({
      where: { id: serviceId },
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        durationMinutes: dto.durationMinutes,
        isActive: dto.isActive
      }
    });
  }

  async delete(serviceId: string) {
    await this.ensureExists(serviceId);

    const bookingExists = await this.prisma.booking.findFirst({
      where: { serviceId },
      select: { id: true }
    });
    if (bookingExists) {
      throw new ConflictException(
        "Нельзя удалить услугу, потому что по ней уже есть бронирования."
      );
    }

    try {
      await this.prisma.service.delete({ where: { id: serviceId } });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictException(
          "Нельзя удалить услугу, потому что по ней уже есть бронирования."
        );
      }
      throw error;
    }

    return { success: true };
  }

  private async ensureExists(serviceId: string) {
    const existingService = await this.prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!existingService) {
      throw new NotFoundException("Service not found.");
    }
  }
}
