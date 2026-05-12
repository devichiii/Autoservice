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
import { AppRole, Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CreateServiceDto } from "./dto/create-service.dto";
import { UpdateServiceDto } from "./dto/update-service.dto";
import { ServicesService } from "./services.service";

@Controller("services")
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  getActiveServices() {
    return this.servicesService.listActive();
  }

  @Get(":id")
  getActiveServiceById(@Param("id") serviceId: string) {
    return this.servicesService.getActiveById(serviceId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN, AppRole.SUPER_ADMIN)
  createService(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN, AppRole.SUPER_ADMIN)
  updateService(@Param("id") serviceId: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(serviceId, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.ADMIN, AppRole.SUPER_ADMIN)
  deleteService(@Param("id") serviceId: string) {
    return this.servicesService.delete(serviceId);
  }
}
