import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { StatisticsResponseDto } from "./dto";
import { StatisticsService } from "./statistics.service";

@ApiTags("Статистика")
@Controller("statistics")
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @ApiOperation({
    summary: "Получение статистики событий",
    description:
      "Возвращает агрегированную статистику: общее количество событий, " +
      "последнее событие, среднюю и максимальную скорость.",
  })
  @ApiResponse({
    status: 200,
    description: "Статистика событий",
    type: StatisticsResponseDto,
  })
  async getStatistics(): Promise<StatisticsResponseDto> {
    return this.statisticsService.getStatistics();
  }
}
