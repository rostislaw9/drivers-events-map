import { Injectable } from "@nestjs/common";
import { plainToInstance } from "class-transformer";

import { CountersService } from "src/modules/counters/counters.service";
import { CreateEventDto, EventResponseDto, ViewportQueryDto } from "./dto";
import { EventsRepository } from "./events.repository";

@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly countersService: CountersService,
  ) {}

  /**
   * Создание события с автоинкрементным ID.
   */
  async create(dto: CreateEventDto): Promise<EventResponseDto> {
    // Получаем следующий порядковый номер атомарно
    const id = await this.countersService.getNextSequence("events");
    const event = await this.eventsRepository.create(dto, id);

    return plainToInstance(EventResponseDto, event.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Получение событий в пределах вьюпорта.
   */
  async findByViewport(
    viewport: ViewportQueryDto,
  ): Promise<EventResponseDto[]> {
    const events = await this.eventsRepository.findByViewport(viewport);
    return plainToInstance(
      EventResponseDto,
      events.map((e) => e.toObject()),
      { excludeExtraneousValues: true },
    );
  }
}
