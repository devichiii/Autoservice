import { NotificationType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class TelegramNotifyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  userId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message!: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
