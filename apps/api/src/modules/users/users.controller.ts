import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from "@nestjs/common";
import { CurrentUser, type AuthUser } from "../../common/decorators/current-user.decorator";
import { AppRole, Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { SetUserRoleDto } from "./dto/set-user-role.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.SUPER_ADMIN)
  listUsers() {
    return this.usersService.listUsers();
  }

  @Patch(":id")
  @Roles(AppRole.ADMIN, AppRole.SUPER_ADMIN)
  updateUser(@Param("id") userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(userId, dto);
  }

  @Post(":id/roles")
  @Roles(AppRole.SUPER_ADMIN)
  addRole(
    @Param("id") userId: string,
    @Body() dto: SetUserRoleDto
  ) {
    return this.usersService.addRole(userId, dto.roleCode);
  }

  @Delete(":id/roles/:roleCode")
  @Roles(AppRole.SUPER_ADMIN)
  removeRole(
    @Param("id") userId: string,
    @Param("roleCode") roleCode: AppRole,
    @CurrentUser() actor: AuthUser | undefined
  ) {
    return this.usersService.removeRole(userId, roleCode, actor?.sub);
  }
}
