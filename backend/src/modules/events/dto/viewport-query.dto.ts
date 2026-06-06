import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, Max, Min } from "class-validator";

export class ViewportQueryDto {
  @ApiProperty({
    description: "Широта северо-восточного угла вьюпорта",
    example: 56.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  northEastLat: number;

  @ApiProperty({
    description: "Долгота северо-восточного угла вьюпорта",
    example: 38.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-540)
  @Max(540)
  northEastLng: number;

  @ApiProperty({
    description: "Широта юго-западного угла вьюпорта",
    example: 55.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  southWestLat: number;

  @ApiProperty({
    description: "Долгота юго-западного угла вьюпорта",
    example: 36.0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-540)
  @Max(540)
  southWestLng: number;
}
