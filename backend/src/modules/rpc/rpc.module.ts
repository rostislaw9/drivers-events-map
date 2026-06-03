import { Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";

import { EventsModule } from "src/modules/events/events.module";
import { EventCreateHandler } from "./handlers/event-create.handler";
import { RpcController } from "./rpc.controller";
import { RpcRegistry } from "./rpc.registry";
import { RpcService } from "./rpc.service";

@Module({
  imports: [DiscoveryModule, EventsModule],
  controllers: [RpcController],
  providers: [RpcService, RpcRegistry, EventCreateHandler],
})
export class RpcModule {}
