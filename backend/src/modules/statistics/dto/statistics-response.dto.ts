import { ApiProperty } from "@nestjs/swagger";

import { EventResponseDto } from "src/modules/events/dto";

export class StatisticsResponseDto {
  @ApiProperty({ description: "Общее количество событий", example: 1500 })
  totalEvents: number;

  @ApiProperty({
    description: "Информация о последнем событии",
    type: EventResponseDto,
    nullable: true,
  })
  lastEvent: EventResponseDto | null;

  @ApiProperty({
    description: "Средняя скорость по всем событиям (км/ч)",
    example: 55.3,
  })
  averageSpeed: number;

  @ApiProperty({
    description: "Максимальная скорость по всем событиям (км/ч)",
    example: 120,
  })
  maxSpeed: number;
}
