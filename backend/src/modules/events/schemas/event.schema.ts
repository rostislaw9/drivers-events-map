import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type EventDocument = HydratedDocument<Event>;

// GeoJSON Point для геопространственных запросов
export interface GeoJsonPoint {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

@Schema({ collection: "events", timestamps: false })
export class Event {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true, default: () => new Date() })
  createdAt: Date;

  @Prop({ required: true, min: -90, max: 90 })
  lat: number;

  @Prop({ required: true, min: -180, max: 180 })
  lng: number;

  @Prop({ required: true, min: 1 })
  oid: number;

  @Prop({ required: true, min: 0 })
  sp: number;

  // GeoJSON Point для индекса 2dsphere
  @Prop({
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: GeoJsonPoint;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Геопространственный индекс для запросов по вьюпорту
EventSchema.index({ location: "2dsphere" });
// Индекс для сортировки по времени создания
EventSchema.index({ createdAt: -1 });
// Уникальный индекс на числовой ID
EventSchema.index({ id: 1 }, { unique: true });
