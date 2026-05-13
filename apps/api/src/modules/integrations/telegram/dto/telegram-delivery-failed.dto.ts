import { IsString, MaxLength } from "class-validator";

export class TelegramDeliveryFailedDto {
  @IsString()
  @MaxLength(900)
  reason!: string;
}
