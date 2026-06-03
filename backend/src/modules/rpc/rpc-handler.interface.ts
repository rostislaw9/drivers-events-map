/**
 * Интерфейс обработчика JSON-RPC метода.
 * Каждый метод реализует этот интерфейс и регистрируется в RpcRegistry.
 */
export interface RpcHandler {
  /**
   * Выполняет обработку метода и возвращает результат.
   * Бросает исключение при ошибке валидации или бизнес-логики.
   */
  execute(params: Record<string, unknown>): Promise<unknown>;
}
