import { SetMetadata } from "@nestjs/common";

/**
 * Ключ метаданных для хранения имени JSON-RPC метода.
 */
export const RPC_METHOD_KEY = "rpc:method";

/**
 * Декоратор для маркировки класса как обработчика JSON-RPC метода.
 * Используется RpcRegistry для автоматического обнаружения через DiscoveryService.
 *
 * @example
 * @RpcMethod("event.create")
 * export class EventCreateHandler implements RpcHandler { ... }
 */
export const RpcMethod = (method: string): ClassDecorator =>
  SetMetadata(RPC_METHOD_KEY, method);
