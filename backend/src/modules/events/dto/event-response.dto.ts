import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class EventResponseDto {
  @Expose()
  @ApiProperty({
    description: "Уникальный числовой идентификатор события",
    example: 123,
  })
  id: number;

  @Expose()
  @ApiProperty({
    description: "Время создания события",
    example: "2026-01-01T00:00:00.000Z",
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: "Широта", example: 55.123 })
  lat: number;

  @Expose()
  @ApiProperty({ description: "Долгота", example: 37.123 })
  lng: number;

  @Expose()
  @ApiProperty({ description: "Идентификатор объекта", example: 100 })
  oid: number;

  @Expose()
  @ApiProperty({ description: "Скорость (км/ч)", example: 60 })
  sp: number;
}
