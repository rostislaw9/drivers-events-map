import { Injectable } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { CreateEventDto } from "src/modules/events/dto";
import { EventsService } from "src/modules/events/events.service";
import type { RpcHandler } from "../rpc-handler.interface";
import { RpcMethod } from "../rpc-method.decorator";
import { RpcValidationError } from "../rpc-validation-error";

/**
 * Обработчик JSON-RPC метода event.create.
 * Создаёт новое событие и возвращает его идентификатор.
 */
@Injectable()
@RpcMethod("event.create")
export class EventCreateHandler implements RpcHandler {
  constructor(private readonly eventsService: EventsService) {}

  async execute(params: Record<string, unknown>): Promise<{ id: number }> {
    const dto = plainToInstance(CreateEventDto, params);
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new RpcValidationError(
        "Некорректные параметры метода event.create",
      );
    }

    const event = await this.eventsService.create(dto);
    return { id: event.id };
  }
}
