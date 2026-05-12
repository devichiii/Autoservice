import {
  Body,
  Controller,
  Delete,
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
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CarsService } from "./cars.service";

@Controller("cars")
@UseGuards(JwtAuthGuard)
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser | undefined, @Body() body: Record<string, unknown>) {
    const userId = this.requireUserId(user);
    return this.carsService.createForOwner(userId, {
      brand: String(body.brand ?? ""),
      model: String(body.model ?? ""),
      year: typeof body.year === "number" ? body.year : undefined,
      vin: typeof body.vin === "string" ? body.vin : undefined,
      plateNumber: typeof body.plateNumber === "string" ? body.plateNumber : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined
    });
  }

  @Get("my")
  listMy(@CurrentUser() user: AuthUser | undefined) {
    const userId = this.requireUserId(user);
    return this.carsService.listOwned(userId);
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: AuthUser | undefined) {
    const userId = this.requireUserId(user);
    return this.carsService.getOwnedById(userId, id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser | undefined,
    @Body() body: Record<string, unknown>
  ) {
    const userId = this.requireUserId(user);
    return this.carsService.updateOwned(userId, id, {
      brand: typeof body.brand === "string" ? body.brand : undefined,
      model: typeof body.model === "string" ? body.model : undefined,
      year: typeof body.year === "number" ? body.year : undefined,
      vin: typeof body.vin === "string" ? body.vin : undefined,
      plateNumber: typeof body.plateNumber === "string" ? body.plateNumber : undefined,
      notes: typeof body.notes === "string" ? body.notes : undefined
    });
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser | undefined) {
    const userId = this.requireUserId(user);
    return this.carsService.deleteOwned(userId, id);
  }

  private requireUserId(user: AuthUser | undefined): string {
    if (!user) {
      throw new UnauthorizedException("Authentication required.");
    }

    return user.sub;
  }
}
