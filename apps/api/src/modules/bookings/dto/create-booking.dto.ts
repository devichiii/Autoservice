import { Type } from "class-transformer";
import { IsDate, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateBookingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  carId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  serviceId!: string;

  @Type(() => Date)
  @IsDate()
  scheduledAt!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
