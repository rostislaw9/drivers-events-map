import { ApiProperty } from "@nestjs/swagger";

class JsonRpcErrorDto {
  @ApiProperty({ description: "Код ошибки JSON-RPC 2.0", example: -32602 })
  code: number;

  @ApiProperty({
    description: "Сообщение об ошибке",
    example: "Некорректные параметры",
  })
  message: string;

  @ApiProperty({ description: "Дополнительные данные ошибки", required: false })
  data?: unknown;
}

export class JsonRpcResponseDto {
  @ApiProperty({ description: "Версия протокола", example: "2.0" })
  jsonrpc: "2.0";

  @ApiProperty({ description: "Результат выполнения метода", required: false })
  result?: unknown;

  @ApiProperty({
    description: "Объект ошибки",
    type: JsonRpcErrorDto,
    required: false,
  })
  error?: JsonRpcErrorDto;

  @ApiProperty({ description: "Идентификатор запроса", example: 1 })
  id: number | string | null;
}
