import { Injectable, OnModuleInit } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";

import type { RpcHandler } from "./rpc-handler.interface";
import { RPC_METHOD_KEY } from "./rpc-method.decorator";

/**
 * Реестр JSON-RPC обработчиков.
 * При инициализации автоматически обнаруживает все провайдеры,
 * помеченные декоратором @RpcMethod, через NestJS DiscoveryService.
 * Для добавления нового метода достаточно создать класс с @RpcMethod.
 */
@Injectable()
export class RpcRegistry implements OnModuleInit {
  private readonly handlers = new Map<string, RpcHandler>();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  onModuleInit(): void {
    const providers = this.discovery.getProviders();

    for (const wrapper of providers) {
      const { instance } = wrapper;
      if (!instance || typeof instance !== "object") continue;

      const method = this.reflector.get<string | undefined>(
        RPC_METHOD_KEY,
        instance.constructor,
      );

      if (method && typeof (instance as RpcHandler).execute === "function") {
        this.handlers.set(method, instance as RpcHandler);
      }
    }
  }

  /**
   * Возвращает обработчик по имени метода или undefined если метод не найден.
   */
  resolve(method: string): RpcHandler | undefined {
    return this.handlers.get(method);
  }
}
