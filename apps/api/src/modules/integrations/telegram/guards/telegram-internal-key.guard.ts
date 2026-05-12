import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TelegramInternalKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expectedKey = this.configService.get<string>("TELEGRAM_BOT_API_KEY");
    if (!expectedKey) {
      throw new UnauthorizedException("Telegram integration key is not configured.");
    }

    const request = context
      .switchToHttp()
      .getRequest<{ headers?: Record<string, string | string[] | undefined> }>();
    const incoming = request.headers?.["x-telegram-api-key"];
    const incomingKey = Array.isArray(incoming) ? incoming[0] : incoming;

    if (!incomingKey || incomingKey !== expectedKey) {
      throw new UnauthorizedException("Invalid integration key.");
    }

    return true;
  }
}
