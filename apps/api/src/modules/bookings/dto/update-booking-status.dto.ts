import { BookingStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
