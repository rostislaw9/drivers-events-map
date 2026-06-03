// Стандартные коды ошибок JSON-RPC 2.0
export const RPC_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

// Текстовые описания кодов для логирования и отладки
export const RPC_ERROR_MESSAGES: Record<number, string> = {
  [-32700]: "Ошибка парсинга",
  [-32600]: "Некорректный запрос",
  [-32601]: "Метод не найден",
  [-32602]: "Некорректные параметры",
  [-32603]: "Внутренняя ошибка сервера",
};
