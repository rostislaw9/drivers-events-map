import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { JsonRpcRequestDto, JsonRpcResponseDto } from "./dto";
import { RpcService } from "./rpc.service";

@ApiTags("JSON-RPC")
@Controller("rpc")
export class RpcController {
  constructor(private readonly rpcService: RpcService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: "JSON-RPC 2.0 эндпоинт",
    description:
      "Эндпоинт для внешних систем. Принимает запросы в формате JSON-RPC 2.0. " +
      "HTTP-статус всегда 200 OK; успех или ошибка определяется по телу ответа. " +
      "Поддерживаемые методы: event.create.",
  })
  @ApiBody({
    type: JsonRpcRequestDto,
    examples: {
      "event.create": {
        summary: "Создание события",
        value: {
          jsonrpc: "2.0",
          method: "event.create",
          params: { lat: 55.123, lng: 37.123, oid: 100, sp: 60 },
          id: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      "Ответ JSON-RPC 2.0. HTTP-статус всегда 200; наличие поля error означает ошибку.",
    type: JsonRpcResponseDto,
    content: {
      "application/json": {
        examples: {
          success: {
            summary: "Успешное создание события",
            value: { jsonrpc: "2.0", result: { id: 123 }, id: 1 },
          },
          invalidParams: {
            summary: "Ошибка: некорректные параметры (-32602)",
            value: {
              jsonrpc: "2.0",
              error: { code: -32602, message: "Некорректные параметры" },
              id: 1,
            },
          },
          methodNotFound: {
            summary: "Ошибка: метод не найден (-32601)",
            value: {
              jsonrpc: "2.0",
              error: { code: -32601, message: "Метод не найден" },
              id: 1,
            },
          },
          invalidRequest: {
            summary: "Ошибка: некорректный запрос (-32600)",
            value: {
              jsonrpc: "2.0",
              error: { code: -32600, message: "Некорректный запрос" },
              id: null,
            },
          },
          internalError: {
            summary: "Ошибка: внутренняя ошибка сервера (-32603)",
            value: {
              jsonrpc: "2.0",
              error: { code: -32603, message: "Внутренняя ошибка сервера" },
              id: 1,
            },
          },
        },
      },
    },
  })
  async handle(@Body() body: unknown): Promise<JsonRpcResponseDto> {
    return this.rpcService.handle(body);
  }
}
