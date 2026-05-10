import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AppRoleCode } from "@prisma/client";
import * as argon2 from "argon2";
import { AppRole } from "../../common/decorators/roles.decorator";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthTokenPayload, TokenPair } from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException("Email already in use.");
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.createClientUser({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName
    });

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((entry) => this.toAppRole(entry.role.code))
    };

    return this.issueTokensAndPersistRefresh(payload);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((entry) => this.toAppRole(entry.role.code))
    };

    return this.issueTokensAndPersistRefresh(payload);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException("Refresh token is invalid.");
    }

    const isValidRefreshToken = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!isValidRefreshToken) {
      throw new UnauthorizedException("Refresh token is invalid.");
    }

    const authPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((entry) => this.toAppRole(entry.role.code))
    };

    return this.issueTokensAndPersistRefresh(authPayload);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user?.refreshTokenHash) {
      return;
    }

    const isValidRefreshToken = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!isValidRefreshToken) {
      throw new UnauthorizedException("Refresh token is invalid.");
    }

    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  getHealth() {
    return { module: "auth", status: "ok", authFlow: "jwt+rbac" };
  }

  private async issueTokensAndPersistRefresh(payload: {
    sub: string;
    email: string;
    roles: AppRole[];
  }): Promise<TokenPair> {
    const tokens = await this.issueTokens(payload);
    const refreshTokenHash = await argon2.hash(tokens.refreshToken);
    await this.usersService.updateRefreshTokenHash(payload.sub, refreshTokenHash);
    return tokens;
  }

  private async issueTokens(payload: {
    sub: string;
    email: string;
    roles: AppRole[];
  }): Promise<TokenPair> {
    const accessTokenSecret = this.configService.getOrThrow<string>("auth.accessTokenSecret");
    const refreshTokenSecret = this.configService.getOrThrow<string>("auth.refreshTokenSecret");
    const accessTokenTtl = this.configService.getOrThrow<string>("auth.accessTokenTtl");
    const refreshTokenTtl = this.configService.getOrThrow<string>("auth.refreshTokenTtl");

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessTokenSecret,
        expiresIn: accessTokenTtl
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshTokenSecret,
        expiresIn: refreshTokenTtl
      })
    ]);

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<AuthTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<AuthTokenPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>("auth.refreshTokenSecret")
      });
    } catch {
      throw new UnauthorizedException("Refresh token is invalid.");
    }
  }

  private toAppRole(roleCode: AppRoleCode): AppRole {
    switch (roleCode) {
      case AppRoleCode.CLIENT:
        return AppRole.CLIENT;
      case AppRoleCode.MANAGER:
        return AppRole.MANAGER;
      case AppRoleCode.ADMIN:
        return AppRole.ADMIN;
      case AppRoleCode.SUPER_ADMIN:
        return AppRole.SUPER_ADMIN;
      default:
        throw new UnauthorizedException("Unsupported role in token payload.");
    }
  }
}
