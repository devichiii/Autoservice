import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { CreateTestNotificationDto } from "./dto/create-test-notification.dto";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("me")
  listMy(@CurrentUser() user: AuthUser | undefined) {
    const authUser = this.requireUser(user);
    return this.notificationsService.listMy(authUser.sub);
  }

  @Patch(":id/read")
  markAsRead(
    @Param("id") notificationId: string,
    @CurrentUser() user: AuthUser | undefined
  ) {
    const authUser = this.requireUser(user);
    return this.notificationsService.markAsRead(authUser.sub, notificationId);
  }

  @Post("test")
  @Roles(AppRole.ADMIN, AppRole.SUPER_ADMIN)
  createTest(
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: CreateTestNotificationDto
  ) {
    const authUser = this.requireUser(user);
    return this.notificationsService.createTestNotification(authUser.sub, dto);
  }

  private requireUser(user: AuthUser | undefined): AuthUser {
    if (!user) {
      throw new UnauthorizedException("Authentication required.");
    }

    return user;
  }
}
