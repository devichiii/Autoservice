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
import { BookingsService } from "./bookings.service";
import { CancelBookingDto } from "./dto/cancel-booking.dto";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { UpdateBookingStatusDto } from "./dto/update-booking-status.dto";

@Controller("bookings")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(AppRole.CLIENT)
  create(@CurrentUser() user: AuthUser | undefined, @Body() dto: CreateBookingDto) {
    const userId = this.requireUserId(user);
    return this.bookingsService.createForClient(userId, dto);
  }

  @Get("my")
  @Roles(AppRole.CLIENT)
  listMy(@CurrentUser() user: AuthUser | undefined) {
    const userId = this.requireUserId(user);
    return this.bookingsService.listMy(userId);
  }

  @Get(":id")
  @Roles(AppRole.CLIENT, AppRole.MANAGER, AppRole.ADMIN, AppRole.SUPER_ADMIN)
  getById(@Param("id") bookingId: string, @CurrentUser() user: AuthUser | undefined) {
    const authUser = this.requireUser(user);
    return this.bookingsService.getByIdForUser(bookingId, authUser.sub, authUser.roles);
  }

  @Get(":id/history")
  @Roles(AppRole.CLIENT, AppRole.MANAGER, AppRole.ADMIN, AppRole.SUPER_ADMIN)
  getHistory(@Param("id") bookingId: string, @CurrentUser() user: AuthUser | undefined) {
    const authUser = this.requireUser(user);
    return this.bookingsService.getHistoryForUser(bookingId, authUser.sub, authUser.roles);
  }

  @Patch(":id/cancel")
  @Roles(AppRole.CLIENT)
  cancel(
    @Param("id") bookingId: string,
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: CancelBookingDto
  ) {
    const userId = this.requireUserId(user);
    return this.bookingsService.cancelByClient(bookingId, userId, dto);
  }

  @Get()
  @Roles(AppRole.MANAGER, AppRole.ADMIN, AppRole.SUPER_ADMIN)
  listAll() {
    return this.bookingsService.listAll();
  }

  @Patch(":id/status")
  @Roles(AppRole.MANAGER, AppRole.ADMIN, AppRole.SUPER_ADMIN)
  updateStatus(
    @Param("id") bookingId: string,
    @CurrentUser() user: AuthUser | undefined,
    @Body() dto: UpdateBookingStatusDto
  ) {
    const authUser = this.requireUser(user);
    return this.bookingsService.updateStatus(bookingId, authUser.sub, authUser.roles, dto);
  }

  private requireUser(user: AuthUser | undefined): AuthUser {
    if (!user) {
      throw new UnauthorizedException("Authentication required.");
    }

    return user;
  }

  private requireUserId(user: AuthUser | undefined): string {
    return this.requireUser(user).sub;
  }
}
