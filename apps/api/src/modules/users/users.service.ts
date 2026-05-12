import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { AppRole } from "../../common/decorators/roles.decorator";
import { PrismaService } from "../../common/database/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";

type CreateUserInput = {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers() {
    return this.prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

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

  async updateUser(userId: string, dto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {})
        },
        include: {
          roles: {
            include: {
              role: true
            }
          }
        }
      });
    } catch {
      throw new NotFoundException("User not found.");
    }
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

  async addRole(userId: string, roleCode: AppRole) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found.");
    }

    const role = await this.prisma.role.findUnique({
      where: { code: roleCode }
    });
    if (!role) {
      throw new NotFoundException("Role not found.");
    }

    const existing = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id
        }
      }
    });
    if (existing) {
      throw new ConflictException("Role is already assigned.");
    }

    await this.prisma.userRole.create({
      data: {
        userId,
        roleId: role.id
      }
    });

    return this.findById(userId);
  }

  async removeRole(userId: string, roleCode: AppRole, actorUserId?: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found.");
    }

    const role = await this.prisma.role.findUnique({
      where: { code: roleCode }
    });
    if (!role) {
      throw new NotFoundException("Role not found.");
    }

    if (actorUserId && actorUserId === userId && roleCode === AppRole.SUPER_ADMIN) {
      throw new ForbiddenException("You cannot remove your own SUPER_ADMIN role.");
    }

    const existing = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id
        }
      }
    });
    if (!existing) {
      throw new ConflictException("Role is not assigned to this user.");
    }

    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id
        }
      }
    });

    return this.findById(userId);
  }
}
