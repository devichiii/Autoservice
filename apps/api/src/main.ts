import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AppModule } from "./app.module";
import { PrismaService } from "./common/database/prisma.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prismaService = app.get(PrismaService);

  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  await prismaService.enableShutdownHooks(app);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
