import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { setupSwagger } from "./swagger/swagger.setup";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Глобальный префикс для всех REST-маршрутов
  app.setGlobalPrefix("api");

  // Глобальная валидация входящих данных
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Настройка CORS для разработки
  app.enableCors();

  // Инициализация Swagger документации
  setupSwagger(app);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}

bootstrap();
