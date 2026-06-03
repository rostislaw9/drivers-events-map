import { ApiProperty } from "@nestjs/swagger";
import { Equals, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class JsonRpcRequestDto {
  @ApiProperty({
    description: 'Версия протокола JSON-RPC (должна быть "2.0")',
    example: "2.0",
  })
  @IsString()
  @Equals("2.0")
  jsonrpc: string;

  @ApiProperty({
    description: "Имя вызываемого метода",
    example: "event.create",
  })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiProperty({
    description: "Параметры метода",
    example: { lat: 55.123, lng: 37.123, oid: 100, sp: 60 },
  })
  params: Record<string, unknown>;

  @ApiProperty({
    description: "Идентификатор запроса",
    example: 1,
    required: false,
  })
  @IsOptional()
  id?: number | string | null;
}
