import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, Max, Min } from "class-validator";

export class CreateEventDto {
  @ApiProperty({
    description: "Широта координаты события",
    example: 55.123,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: "Долгота координаты события",
    example: 37.123,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    description: "Идентификатор объекта (положительное целое число)",
    example: 100,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  oid: number;

  @ApiProperty({
    description: "Скорость объекта (км/ч, неотрицательное число)",
    example: 60,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  sp: number;
}
