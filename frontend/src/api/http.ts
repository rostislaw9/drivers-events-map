// Базовый URL API; при работе через Nginx равен /api
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

// Базовая функция запросов; бросает исключение при не 2xx статусе
async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    throw new Error(
      `Ошибка запроса: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

export const http = {
  get: <T>(path: string) => fetcher<T>(path),
};
