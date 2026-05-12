import { IsDateString, IsString, MaxLength, MinLength } from "class-validator";

export class AvailableSlotsQueryDto {
  @IsDateString()
  date!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  serviceId!: string;
}
