import { Injectable } from "@nestjs/common";
import { AppRole } from "../../common/decorators/roles.decorator";
import { PrismaService } from "../../common/database/prisma.service";

type CreateUserInput = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }

  async updateRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash }
    });
  }

  async createClientUser(input: CreateUserInput) {
    return this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        roles: {
          create: {
            role: {
              connectOrCreate: {
                where: { code: AppRole.CLIENT },
                create: {
                  code: AppRole.CLIENT,
                  title: "Client"
                }
              }
            }
          }
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  }
}
