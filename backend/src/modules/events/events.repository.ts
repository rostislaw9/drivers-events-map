import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, PipelineStage } from "mongoose";

import { CreateEventDto, ViewportQueryDto } from "./dto";
import { Event, EventDocument } from "./schemas/event.schema";

// Максимальное количество событий в вьюпорте
const VIEWPORT_EVENTS_LIMIT = 100;
// Географические границы долготы в MongoDB/GeoJSON
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;
// Полный оборот вокруг Земли по долготе
const WORLD_LONGITUDE_SPAN = 360;

@Injectable()
export class EventsRepository {
  constructor(
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  /**
   * Создание нового события с присвоенным ID.
   */
  async create(dto: CreateEventDto, id: number): Promise<EventDocument> {
    const event = new this.eventModel({
      id,
      lat: dto.lat,
      lng: dto.lng,
      oid: dto.oid,
      sp: dto.sp,
      createdAt: new Date(),
      // GeoJSON Point: координаты в порядке [lng, lat] согласно стандарту
      location: {
        type: "Point",
        coordinates: [dto.lng, dto.lat],
      },
    });

    return event.save();
  }

  /**
   * Поиск событий в географическом вьюпорте через геопространственный запрос MongoDB.
   * Возвращает не более 100 новейших событий.
   */
  async findByViewport(viewport: ViewportQueryDto): Promise<EventDocument[]> {
    const docs = await this.eventModel
      .find(this.buildViewportFilter(viewport))
      .sort({ createdAt: -1 })
      .limit(VIEWPORT_EVENTS_LIMIT)
      .exec();
    return docs;
  }

  private buildViewportFilter(
    viewport: ViewportQueryDto,
  ): FilterQuery<EventDocument> {
    // Mapbox может вернуть долготы за пределами [-180, 180] при пересечении антимеридиана
    const longitudeSpan = viewport.northEastLng - viewport.southWestLng;

    // Если вьюпорт покрывает весь мир по долготе, ищем по полному диапазону [-180, 180]
    if (longitudeSpan >= WORLD_LONGITUDE_SPAN) {
      return this.buildBoxFilter(viewport, MIN_LONGITUDE, MAX_LONGITUDE);
    }

    // Вьюпорт пересёк антимеридиан: разбиваем его на две валидные GeoJSON-области
    if (viewport.northEastLng > MAX_LONGITUDE) {
      return {
        $or: [
          // Правая часть до +180
          this.buildBoxFilter(viewport, viewport.southWestLng, MAX_LONGITUDE),
          // Левая часть после переноса longitudes на -360
          this.buildBoxFilter(
            viewport,
            MIN_LONGITUDE,
            viewport.northEastLng - WORLD_LONGITUDE_SPAN,
          ),
        ],
      };
    }

    // Вьюпорт пересёк антимеридиан со стороны -180: переносим западную границу на +360
    if (viewport.southWestLng < MIN_LONGITUDE) {
      return {
        $or: [
          // Правая часть после переноса longitudes на +360
          this.buildBoxFilter(
            viewport,
            viewport.southWestLng + WORLD_LONGITUDE_SPAN,
            MAX_LONGITUDE,
          ),
          // Левая часть от -180 до восточной границы
          this.buildBoxFilter(viewport, MIN_LONGITUDE, viewport.northEastLng),
        ],
      };
    }

    // Обычный случай: западная и восточная долготы находятся в диапазоне [-180, 180]
    return this.buildBoxFilter(
      viewport,
      viewport.southWestLng,
      viewport.northEastLng,
    );
  }

  private buildBoxFilter(
    viewport: ViewportQueryDto,
    westLng: number,
    eastLng: number,
  ): FilterQuery<EventDocument> {
    return {
      location: {
        $geoWithin: {
          $box: [
            // Юго-западный угол [lng, lat]
            [westLng, viewport.southWestLat],
            // Северо-восточный угол [lng, lat]
            [eastLng, viewport.northEastLat],
          ],
        },
      },
    };
  }

  /**
   * Получение последнего созданного события.
   */
  async findLast(): Promise<EventDocument | null> {
    return this.eventModel.findOne().sort({ createdAt: -1 }).exec();
  }

  /**
   * Агрегация статистики: количество, средняя и максимальная скорость.
   */
  async aggregate<T>(pipeline: PipelineStage[]): Promise<T[]> {
    return this.eventModel.aggregate<T>(pipeline).exec();
  }
}
