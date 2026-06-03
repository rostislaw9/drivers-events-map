// Событие, получаемое от REST API
export interface Event {
  id: number; // Автоинкрементный идентификатор
  createdAt: string; // ISO 8601
  lat: number; // Широта [-90, 90]
  lng: number; // Долгота [-180, 180]
  oid: number; // Идентификатор объекта
  sp: number; // Скорость в км/ч
}

// Агрегированная статистика по всем событиям в базе
export interface Statistics {
  totalEvents: number; // Общее количество событий
  lastEvent: Event | null; // Последнее добавленное событие
  averageSpeed: number; // Средняя скорость в км/ч
  maxSpeed: number; // Максимальная скорость в км/ч
}

// Географические границы видимой области карты; передаются параметрами GET /events
export interface ViewportBounds {
  northEastLat: number;
  northEastLng: number;
  southWestLat: number;
  southWestLng: number;
}
