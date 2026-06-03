import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type CounterDocument = HydratedDocument<Counter>;

/**
 * Схема атомарного счётчика для генерации последовательных ID.
 * Одна запись на каждый тип сущности (например, "events").
 */
@Schema({ collection: "counters" })
export class Counter {
  // Имя счётчика, используется как ключ (например, "events")
  @Prop({ required: true })
  _id: string;

  // Текущее значение счётчика; инкрементируется атомарно через $inc
  @Prop({ required: true, default: 0 })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
