import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

import { Counter, CounterDocument } from "./schemas/counter.schema";

@Injectable()
export class CountersService {
  constructor(
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
  ) {}

  /**
   * Атомарное получение следующего значения счётчика.
   * Использует findOneAndUpdate для предотвращения гонок.
   */
  async getNextSequence(name: string): Promise<number> {
    const result = await this.counterModel.findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );

    return result.seq;
  }
}
