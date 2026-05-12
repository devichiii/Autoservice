import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AvailableSlotsQueryDto } from "./dto/available-slots-query.dto";
import { ScheduleService } from "./schedule.service";

@Controller("schedule")
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get("available-slots")
  getAvailableSlots(@Query() query: AvailableSlotsQueryDto) {
    return this.scheduleService.getAvailableSlots(query.date, query.serviceId);
  }
}
