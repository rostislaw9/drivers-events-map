import { Injectable } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { PipelineStage } from "mongoose";

import { EventResponseDto } from "src/modules/events/dto";
import { EventsRepository } from "src/modules/events/events.repository";
import { StatisticsResponseDto } from "./dto";

// Структура результата агрегации MongoDB
interface StatsAggregationResult {
  totalEvents: number;
  averageSpeed: number;
  maxSpeed: number;
}

@Injectable()
export class StatisticsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  /**
   * Вычисление статистики через агрегационный пайплайн MongoDB.
   * Не загружает все события в память.
   */
  async getStatistics(): Promise<StatisticsResponseDto> {
    const [stats, lastEventDoc] = await Promise.all([
      this.eventsRepository.aggregate<StatsAggregationResult>([
        {
          $group: {
            _id: null,
            totalEvents: { $sum: 1 },
            averageSpeed: { $avg: "$sp" },
            maxSpeed: { $max: "$sp" },
          },
        },
      ] as PipelineStage[]),
      this.eventsRepository.findLast(),
    ]);

    const result = stats[0];

    const lastEvent = lastEventDoc
      ? plainToInstance(EventResponseDto, lastEventDoc.toObject(), {
          excludeExtraneousValues: true,
        })
      : null;

    return {
      totalEvents: result?.totalEvents ?? 0,
      lastEvent,
      averageSpeed: result ? Math.round(result.averageSpeed * 100) / 100 : 0,
      maxSpeed: result?.maxSpeed ?? 0,
    };
  }
}
