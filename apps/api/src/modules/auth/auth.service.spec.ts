import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AppRoleCode } from "@prisma/client";
import * as argon2 from "argon2";
import { UsersService } from "../users/users.service";
import { AuthService } from "./auth.service";

jest.mock("argon2", () => ({
  hash: jest.fn(),
  verify: jest.fn()
}));

describe("AuthService regression", () => {
  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updateRefreshTokenHash: jest.fn(),
    createClientUser: jest.fn()
  } as unknown as jest.Mocked<UsersService>;

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn()
  } as unknown as jest.Mocked<JwtService>;

  const configService = {
    getOrThrow: jest.fn()
  } as unknown as jest.Mocked<ConfigService>;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    configService.getOrThrow = jest.fn((key: string) => {
      const values: Record<string, string> = {
        "auth.accessTokenSecret": "access-secret",
        "auth.refreshTokenSecret": "refresh-secret",
        "auth.accessTokenTtl": "15m",
        "auth.refreshTokenTtl": "7d"
      };
      return values[key];
    }) as unknown as jest.MockedFunction<ConfigService["getOrThrow"]>;

    service = new AuthService(usersService, jwtService, configService);
  });

  it("login: выдает токены при валидных credentials", async () => {
    usersService.findByEmail.mockResolvedValue({
      id: "clientA",
      email: "client@example.com",
      passwordHash: "hashed-password",
      roles: [{ role: { code: AppRoleCode.CLIENT } }]
    } as never);
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync
      .mockResolvedValueOnce("access-token")
      .mockResolvedValueOnce("refresh-token");
    (argon2.hash as jest.Mock).mockResolvedValue("hashed-refresh-token");
    usersService.updateRefreshTokenHash.mockResolvedValue({} as never);

    const result = await service.login({
      email: "client@example.com",
      password: "Password123!"
    });

    expect(result).toEqual({
      accessToken: "access-token",
      refreshToken: "refresh-token"
    });
    expect(usersService.updateRefreshTokenHash).toHaveBeenCalledWith(
      "clientA",
      "hashed-refresh-token"
    );
  });

  it("login: возвращает 401 при неверном пароле", async () => {
    usersService.findByEmail.mockResolvedValue({
      id: "clientA",
      email: "client@example.com",
      passwordHash: "hashed-password",
      roles: [{ role: { code: AppRoleCode.CLIENT } }]
    } as never);
    (argon2.verify as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({
        email: "client@example.com",
        password: "wrong-password"
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("refresh: перевыпускает токены при валидном refresh", async () => {
    jwtService.verifyAsync.mockResolvedValue({
      sub: "clientA",
      email: "client@example.com",
      roles: ["CLIENT"]
    } as never);
    usersService.findById.mockResolvedValue({
      id: "clientA",
      email: "client@example.com",
      refreshTokenHash: "stored-refresh-hash",
      roles: [{ role: { code: AppRoleCode.CLIENT } }]
    } as never);
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync
      .mockResolvedValueOnce("new-access-token")
      .mockResolvedValueOnce("new-refresh-token");
    (argon2.hash as jest.Mock).mockResolvedValue("new-refresh-token-hash");
    usersService.updateRefreshTokenHash.mockResolvedValue({} as never);

    const result = await service.refresh("valid-refresh-token");

    expect(result).toEqual({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token"
    });
    expect(usersService.updateRefreshTokenHash).toHaveBeenCalledWith(
      "clientA",
      "new-refresh-token-hash"
    );
  });

  it("logout: возвращает 401 при невалидном refresh", async () => {
    usersService.findById.mockResolvedValue({
      id: "clientA",
      refreshTokenHash: "stored-refresh-hash"
    } as never);
    (argon2.verify as jest.Mock).mockResolvedValue(false);

    await expect(service.logout("clientA", "wrong-refresh-token")).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });
});
