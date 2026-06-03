import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { CountersModule } from "src/modules/counters/counters.module";
import { EventsController } from "./events.controller";
import { EventsRepository } from "./events.repository";
import { EventsService } from "./events.service";
import { Event, EventSchema } from "./schemas/event.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }]),
    CountersModule,
  ],
  controllers: [EventsController],
  providers: [EventsService, EventsRepository],
  exports: [EventsService, EventsRepository],
})
export class EventsModule {}
