import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";

import appConfig from "./config/app.config";
import { CountersModule } from "./modules/counters/counters.module";
import { EventsModule } from "./modules/events/events.module";
import { RpcModule } from "./modules/rpc/rpc.module";
import { StatisticsModule } from "./modules/statistics/statistics.module";

@Module({
  imports: [
    // Загрузка переменных окружения
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    // Подключение к MongoDB
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>("app.mongoUri"),
      }),
    }),
    EventsModule,
    StatisticsModule,
    CountersModule,
    RpcModule,
  ],
})
export class AppModule {}
