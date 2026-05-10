import {
  Body,
  Controller,
  Get,
  Post,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import {
  AuthUser,
  CurrentUser
} from "../../common/decorators/current-user.decorator";
import { AppRole, Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: LogoutDto
  ) {
    if (!user) {
      throw new UnauthorizedException("Authentication required.");
    }

    await this.authService.logout(user.sub, dto.refreshToken);
    return { success: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser | undefined) {
    return { user };
  }

  @Get("health")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN, AppRole.SUPER_ADMIN)
  getHealth() {
    return this.authService.getHealth();
  }
}
