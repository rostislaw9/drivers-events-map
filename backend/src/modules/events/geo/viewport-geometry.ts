import type { ViewportQueryDto } from "../dto";
import type { ViewportGeometry } from "./types";

const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;
const WORLD_LONGITUDE_SPAN = 360;
// MongoDB $geoWithin right-hand rule: полигоны >= 180° трактуются как дополнение.
// Каждый bbox должен быть строго уже 180° по долготе.
const MAX_POLYGON_LONGITUDE_SPAN = 180;
// MongoDB 2dsphere не поддерживает полюсные точки (±90) в полигонах.
const MAX_LATITUDE = 89.9999;
const MIN_LATITUDE = -89.9999;

type Position = [number, number];
type Bbox = [
  westLng: number,
  eastLng: number,
  southLat: number,
  northLat: number,
];

function bboxPolygon(
  westLng: number,
  eastLng: number,
  southLat: number,
  northLat: number,
): Position[] {
  return [
    [westLng, southLat],
    [eastLng, southLat],
    [eastLng, northLat],
    [westLng, northLat],
    [westLng, southLat],
  ];
}

// Рекурсивно делит bbox пополам пока span >= 180°.
// Гарантирует что каждый результирующий bbox < 180° по долготе.
function splitBbox(
  west: number,
  east: number,
  south: number,
  north: number,
): Bbox[] {
  if (east - west < MAX_POLYGON_LONGITUDE_SPAN) {
    return [[west, east, south, north]];
  }
  const mid = west + (east - west) / 2;
  return [
    ...splitBbox(west, mid, south, north),
    ...splitBbox(mid, east, south, north),
  ];
}

export function isFullWorld(viewport: ViewportQueryDto): boolean {
  return viewport.northEastLng - viewport.southWestLng >= WORLD_LONGITUDE_SPAN;
}

export function buildViewportGeometry(
  viewport: ViewportQueryDto,
): ViewportGeometry {
  const { northEastLng, southWestLng } = viewport;
  const northEastLat = Math.min(viewport.northEastLat, MAX_LATITUDE);
  const southWestLat = Math.max(viewport.southWestLat, MIN_LATITUDE);

  // Собираем список bbox в нормализованных координатах [-180, 180]
  let bboxes: Bbox[];

  if (northEastLng > MAX_LONGITUDE) {
    // Пересечение антимеридиана вправо: splitBbox каждую половину отдельно
    bboxes = [
      ...splitBbox(southWestLng, MAX_LONGITUDE, southWestLat, northEastLat),
      ...splitBbox(
        MIN_LONGITUDE,
        northEastLng - WORLD_LONGITUDE_SPAN,
        southWestLat,
        northEastLat,
      ),
    ];
  } else if (southWestLng < MIN_LONGITUDE) {
    // Пересечение антимеридиана влево
    bboxes = [
      ...splitBbox(
        southWestLng + WORLD_LONGITUDE_SPAN,
        MAX_LONGITUDE,
        southWestLat,
        northEastLat,
      ),
      ...splitBbox(MIN_LONGITUDE, northEastLng, southWestLat, northEastLat),
    ];
  } else {
    bboxes = splitBbox(southWestLng, northEastLng, southWestLat, northEastLat);
  }

  if (bboxes.length === 1) {
    const [w, e, s, n] = bboxes[0];
    return {
      type: "Polygon",
      coordinates: [bboxPolygon(w, e, s, n)],
    };
  }

  return {
    type: "MultiPolygon",
    coordinates: bboxes.map(([w, e, s, n]) => [bboxPolygon(w, e, s, n)]),
  };
}
