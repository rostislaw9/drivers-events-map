import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { EventResponseDto, ViewportQueryDto } from "./dto";
import { EventsService } from "./events.service";

@ApiTags("События")
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: "Получение событий в области карты",
    description:
      "Возвращает не более 100 новейших событий в пределах указанного вьюпорта. " +
      "Фильтрация выполняется через геопространственный индекс MongoDB.",
  })
  @ApiResponse({
    status: 200,
    description: "Список событий в вьюпорте",
    type: [EventResponseDto],
  })
  async findByViewport(
    @Query() viewport: ViewportQueryDto,
  ): Promise<EventResponseDto[]> {
    return this.eventsService.findByViewport(viewport);
  }
}
