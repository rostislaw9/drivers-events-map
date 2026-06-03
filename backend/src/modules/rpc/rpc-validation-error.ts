/**
 * Ошибка валидации параметров JSON-RPC метода.
 * Бросается обработчиком при невалидных входных данных.
 */
export class RpcValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RpcValidationError";
  }
}
