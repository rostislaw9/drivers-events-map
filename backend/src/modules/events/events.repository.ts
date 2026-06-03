import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, PipelineStage } from "mongoose";

import { CreateEventDto, ViewportQueryDto } from "./dto";
import { Event, EventDocument } from "./schemas/event.schema";

// Максимальное количество событий в вьюпорте
const VIEWPORT_EVENTS_LIMIT = 100;

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
      .find({
        location: {
          $geoWithin: {
            $box: [
              // Юго-западный угол [lng, lat]
              [viewport.southWestLng, viewport.southWestLat],
              // Северо-восточный угол [lng, lat]
              [viewport.northEastLng, viewport.northEastLat],
            ],
          },
        },
      })
      .sort({ createdAt: -1 })
      .limit(VIEWPORT_EVENTS_LIMIT)
      .exec();
    return docs;
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
