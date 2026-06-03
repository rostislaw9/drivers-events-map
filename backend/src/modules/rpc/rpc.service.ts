import { Injectable, Logger } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { JsonRpcRequestDto, JsonRpcResponseDto } from "./dto";
import { RPC_ERROR_CODES, RPC_ERROR_MESSAGES } from "./rpc-error-codes";
import { RpcValidationError } from "./rpc-validation-error";
import { RpcRegistry } from "./rpc.registry";

@Injectable()
export class RpcService {
  private readonly logger = new Logger(RpcService.name);

  constructor(private readonly registry: RpcRegistry) {}

  /**
   * Обработка JSON-RPC запроса: валидация структуры и маршрутизация через реестр.
   */
  async handle(body: unknown): Promise<JsonRpcResponseDto> {
    if (!body || typeof body !== "object") {
      return this.buildError(RPC_ERROR_CODES.INVALID_REQUEST, null);
    }

    const request = plainToInstance(JsonRpcRequestDto, body);
    const errors = await validate(request);

    if (errors.length > 0) {
      const id =
        ((body as Record<string, unknown>).id as number | string | null) ??
        null;
      return this.buildError(RPC_ERROR_CODES.INVALID_REQUEST, id);
    }

    return this.dispatch(request);
  }

  /**
   * Диспетчеризация запроса через реестр обработчиков.
   */
  private async dispatch(
    request: JsonRpcRequestDto,
  ): Promise<JsonRpcResponseDto> {
    const id = request.id ?? null;
    const handler = this.registry.resolve(request.method);

    if (!handler) {
      return this.buildError(RPC_ERROR_CODES.METHOD_NOT_FOUND, id);
    }

    try {
      const result = await handler.execute(request.params);
      return { jsonrpc: "2.0", result, id };
    } catch (error) {
      if (error instanceof RpcValidationError) {
        return this.buildError(RPC_ERROR_CODES.INVALID_PARAMS, id);
      }
      this.logger.error("Внутренняя ошибка обработки RPC запроса", error);
      return this.buildError(RPC_ERROR_CODES.INTERNAL_ERROR, id);
    }
  }

  /**
   * Формирование стандартного ответа с ошибкой JSON-RPC 2.0.
   */
  private buildError(
    code: number,
    id: number | string | null,
  ): JsonRpcResponseDto {
    return {
      jsonrpc: "2.0",
      error: { code, message: RPC_ERROR_MESSAGES[code] },
      id,
    };
  }
}
