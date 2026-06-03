import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Drivers Events Map API")
    .setDescription(
      "API для системы отображения событий на карте. " +
        "Предоставляет REST эндпоинты для фронтенда и JSON-RPC 2.0 для внешних систем.",
    )
    .setVersion("1.0")
    .addTag("События", "Управление событиями")
    .addTag("Статистика", "Агрегированная статистика событий")
    .addTag("JSON-RPC", "Endpoint для внешних систем (JSON-RPC 2.0)")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);
}
