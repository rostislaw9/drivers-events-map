import type { Event, ViewportBounds } from "@/shared/types";
import { http } from "./http";

// Загружает события в пределах видимой области карты (max 100 новейших)
export function fetchEvents(bounds: ViewportBounds): Promise<Event[]> {
  const params = new URLSearchParams({
    northEastLat: String(bounds.northEastLat),
    northEastLng: String(bounds.northEastLng),
    southWestLat: String(bounds.southWestLat),
    southWestLng: String(bounds.southWestLng),
  });

  return http.get<Event[]>(`/events?${params.toString()}`);
}
