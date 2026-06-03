import type { Feature, FeatureCollection, Point } from "geojson";
import type { GeoJSONFeature, GeoJSONSource } from "mapbox-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import Map, {
  Layer,
  NavigationControl,
  Popup,
  Source,
  type MapMouseEvent,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl";
import { toast } from "sonner";

import { useEvents } from "@/entities/event/hooks/useEvents";
import { EventPopup } from "@/features/EventPopup/EventPopup";
import type { Event, ViewportBounds } from "@/shared/types";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const INITIAL_VIEW = {
  longitude: 37.6173,
  latitude: 55.7558,
  zoom: 7,
};

// Извлекает текущие границы видимой области карты в формате ViewportBounds
function boundsFromMap(map: MapRef): ViewportBounds | null {
  const bounds = map.getBounds();
  if (!bounds) return null;
  return {
    northEastLat: bounds.getNorthEast().lat,
    northEastLng: bounds.getNorthEast().lng,
    southWestLat: bounds.getSouthWest().lat,
    southWestLng: bounds.getSouthWest().lng,
  };
}

// Преобразует массив событий в GeoJSON FeatureCollection для передачи в Mapbox Source
// Все поля события дублируются в properties, т.к. geometry содержит только координаты
function eventsToGeoJson(events: Event[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: events.map(
      (e): Feature => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [e.lng, e.lat] },
        properties: {
          id: e.id,
          createdAt: e.createdAt,
          lat: e.lat,
          lng: e.lng,
          oid: e.oid,
          sp: e.sp,
        },
      }),
    ),
  };
}

interface MapWidgetProps {
  // Колбэк вызывается при монтировании и передаёт наружу функцию повторного запроса событий
  onRefreshReady?: (refetch: () => void) => void;
  // Колбэк вызывается при монтировании и передаёт наружу функцию перелёта карты к координатам.
  // Третий аргумент event — событие, попап которого откроется после приземления.
  onLocateReady?: (
    locate: (lat: number, lng: number, event?: Event) => void,
  ) => void;
}

export function MapWidget({
  onRefreshReady,
  onLocateReady,
}: MapWidgetProps = {}) {
  const mapRef = useRef<MapRef>(null);
  // Флаг: карта выполняет flyTo — не обновляем вьюпорт во время полёта,
  // иначе Source пересчитывается и кластеры смещаются до приземления
  const isFlyingRef = useRef(false);
  // Флаг готовности карты — Source рендерится только после инициализации map instance
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [viewport, setViewport] = useState<ViewportBounds | null>(null);
  const [popupState, setPopupState] = useState<{
    lat: number;
    lng: number;
    events: Event[];
  } | null>(null);

  const { data: events = [], isError, refetch } = useEvents(viewport);

  // Передаём refetch наружу для кнопки "Обновить"
  useEffect(() => {
    onRefreshReady?.(() => void refetch());
  }, [onRefreshReady, refetch]);

  // Передаём flyTo наружу для кнопки "Найти на карте"
  // После приземления открываем попап для переданного события
  useEffect(() => {
    onLocateReady?.((lat, lng, event) => {
      isFlyingRef.current = true;
      const map = mapRef.current;
      map?.flyTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 16),
        duration: 1200,
      });
      map?.getMap().once("moveend", () => {
        isFlyingRef.current = false;
        if (mapRef.current) setViewport(boundsFromMap(mapRef.current));
        if (event) {
          setPopupState({ lat: event.lat, lng: event.lng, events: [event] });
        }
      });
    });
  }, [onLocateReady]);

  // Показываем toast при ошибке загрузки событий
  useEffect(() => {
    if (!isError) return;
    toast.error("Ошибка загрузки событий", {
      description: "Не удалось получить события с сервера",
    });
  }, [isError, refetch]);

  // Закрываем попап при потере фокуса окна
  useEffect(() => {
    const close = () => setPopupState(null);
    window.addEventListener("blur", close);
    document.addEventListener("visibilitychange", close);
    return () => {
      window.removeEventListener("blur", close);
      document.removeEventListener("visibilitychange", close);
    };
  }, []);

  // Индекс событий по id для O(1) поиска при обработке кликов на кластеры и маркеры
  const eventsById = events.reduce<Record<number, Event>>((acc, e) => {
    acc[e.id] = e;
    return acc;
  }, {});

  // Обновляем вьюпорт после завершения движения карты.
  // Во время flyTo пропускаем промежуточные moveend-события, чтобы Source
  // не пересчитывался на лету и кластеры не смещались до приземления.
  const handleMoveEnd = useCallback((e: ViewStateChangeEvent) => {
    if (isFlyingRef.current) return;
    if (mapRef.current) {
      const bounds = boundsFromMap(mapRef.current);
      setViewport(bounds);
    }
    void e;
  }, []);

  // Инициализируем вьюпорт после загрузки карты и навешиваем курсоры
  const handleMapLoad = useCallback(() => {
    if (!mapRef.current) return;
    setIsMapLoaded(true);
    setViewport(boundsFromMap(mapRef.current));

    const canvas = mapRef.current.getCanvas();
    canvas.style.cursor = "grab";

    const setPointer = () => {
      canvas.style.cursor = "pointer";
    };
    const setGrab = () => {
      canvas.style.cursor = "grab";
    };
    mapRef.current.on("mouseenter", "clusters", setPointer);
    mapRef.current.on("mouseleave", "clusters", setGrab);
    mapRef.current.on("mouseenter", "unclustered-point", setPointer);
    mapRef.current.on("mouseleave", "unclustered-point", setGrab);
    mapRef.current.on("dragstart", () => {
      canvas.style.cursor = "grabbing";
    });
    mapRef.current.on("dragend", () => {
      canvas.style.cursor = "grab";
    });
  }, []);

  // Клик по кластеру — приближаем карту или показываем попап если кластер неразделяем
  const handleClusterClick = useCallback(
    (e: MapMouseEvent) => {
      if (!mapRef.current) return;
      const features = mapRef.current.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      if (!features.length) return;

      const clusterId = features[0].properties?.cluster_id as number;
      const source = mapRef.current.getSource("events") as GeoJSONSource;
      const mapMaxZoom = mapRef.current.getMap().getMaxZoom();
      const currentZoom = mapRef.current.getZoom();

      const pointCount = features[0].properties?.point_count as number;

      // Запрашиваем листья кластера — они нужны в обеих ветках (попап и flyTo)
      source.getClusterLeaves(clusterId, pointCount, 0, (leavesErr, leaves) => {
        if (leavesErr || !leaves || !leaves.length) return;

        // Берём координаты из первого листа: они оригинальные (не тайл-снаппированные),
        // что важно для flyTo. Для попапа это работает корректно при одинаковых
        // координатах точек; при разных — кластер раскрывается зумом, а не попапом.
        const firstLeafGeom = (leaves[0] as GeoJSONFeature).geometry as Point;
        const exactCenter: [number, number] = [
          firstLeafGeom.coordinates[0],
          firstLeafGeom.coordinates[1],
        ];

        const leafIds = (leaves as GeoJSONFeature[]).map(
          (f) => (f.properties as { id: number }).id,
        );
        const atPoint = leafIds
          .map((id) => eventsById[id])
          .filter((ev): ev is Event => ev !== undefined);

        source.getClusterExpansionZoom(clusterId, (err, expansionZoom) => {
          if (err || expansionZoom === null || expansionZoom === undefined) {
            return;
          }

          // Точки неразделимы если expansionZoom выше максимума карты
          // ИЛИ мы уже находимся на этом зуме (дальше зумить некуда)
          const cannotExpand =
            expansionZoom > mapMaxZoom || currentZoom >= expansionZoom;

          if (cannotExpand) {
            // Кластер неразделяем (достигнут maxZoom или expansionZoom) — показываем попап.
            // Позиция попапа берётся из e.lngLat — точное место клика на экране.
            if (!atPoint.length) return;
            setPopupState({
              lat: e.lngLat.lat,
              lng: e.lngLat.lng,
              events: atPoint,
            });
          } else {
            isFlyingRef.current = true;
            const map = mapRef.current;
            // Летим к точным координатам листа, а не к тайл-снаппированному центроиду
            map?.flyTo({
              center: exactCenter,
              zoom: expansionZoom,
              duration: 600,
            });
            // После завершения полёта сбрасываем флаг и обновляем вьюпорт
            map?.getMap().once("moveend", () => {
              isFlyingRef.current = false;
              if (mapRef.current) {
                setViewport(boundsFromMap(mapRef.current));
              }
            });
          }
        });
      });
    },
    [eventsById],
  );

  // Клик по одиночному маркеру — показываем попап со всеми событиями в точке
  const handleMarkerClick = useCallback(
    (e: MapMouseEvent) => {
      if (!mapRef.current) return;
      const features = mapRef.current.queryRenderedFeatures(e.point, {
        layers: ["unclustered-point"],
      });
      if (!features.length) return;

      // Находим кликнутое событие по id из properties
      const clickedId = (features[0].properties as { id: number }).id;
      const clickedEvent = eventsById[clickedId];
      if (!clickedEvent) return;

      const { lat, lng } = clickedEvent;
      // Собираем все события с теми же координатами
      const atPoint = events.filter((ev) => ev.lat === lat && ev.lng === lng);

      // Центрируем карту на маркере, попап открываем после приземления
      // Проблема: при малом зуме может оказаться так, что одно событие не попадёт в кластер,
      // отобразится одиночный маркер, но по клику зум увеличится, откроется попап для этого события,
      // хотя на месте маркера уже отрисован кластер, и при закрытии попапа и повторном его открытии
      // откроется попап уже для кластера, а не для одиночного события
      // isFlyingRef.current = true;
      // const map = mapRef.current;
      // map?.flyTo({
      //   center: [lng, lat],
      //   zoom: Math.max(map.getZoom(), 16),
      //   duration: 1200,
      // });
      // map?.getMap().once("moveend", () => {
      //   isFlyingRef.current = false;
      //   if (mapRef.current) setViewport(boundsFromMap(mapRef.current));
      //   setPopupState({ lat, lng, events: atPoint });
      // });

      setPopupState({ lat, lng, events: atPoint });
    },
    [eventsById, events],
  );

  // Объединённый обработчик кликов
  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (!mapRef.current) return;
      const hit = mapRef.current.queryRenderedFeatures(e.point, {
        layers: ["clusters", "unclustered-point"],
      });
      if (!hit.length) {
        // Клик по пустой области — закрываем попап
        setPopupState(null);
        return;
      }
      handleClusterClick(e);
      handleMarkerClick(e);
    },
    [handleClusterClick, handleMarkerClick],
  );

  const geojson = eventsToGeoJson(events);

  const handlePopupClose = useCallback(() => {
    setPopupState(null);
  }, []);

  return (
    <div className="relative w-full h-full rounded-xl border">
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={INITIAL_VIEW}
        minZoom={2}
        style={{ width: "100%", height: "100%", borderRadius: "14px" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        projection={{ name: "globe" }}
        onLoad={handleMapLoad}
        onMoveEnd={handleMoveEnd}
        onZoomStart={() => setPopupState(null)} // Закрываем попап при начале зума
        onClick={handleMapClick}
        interactiveLayerIds={["clusters", "unclustered-point"]}
      >
        <NavigationControl position="top-right" />

        {isMapLoaded && (
          <Source
            id="events"
            type="geojson"
            data={geojson}
            cluster={true}
            clusterMaxZoom={18} // Выше этого зума кластеры не формируются
            clusterRadius={50} // Радиус в пикселях для объединения точек в кластер
          >
            {/* Слой кластеров */}
            <Layer
              id="clusters"
              type="circle"
              source="events"
              filter={["has", "point_count"]}
              paint={{
                "circle-color": [
                  "step",
                  ["get", "point_count"],
                  "#3b82f6",
                  10,
                  "#6366f1",
                  20,
                  "#7c3aed",
                  30,
                  "#7e22ce",
                  40,
                  "#6d28d9",
                  50,
                  "#5b21b6",
                  60,
                  "#4c1d95",
                  70,
                  "#4a1080",
                  80,
                  "#3b0764",
                  90,
                  "#2e1065",
                  100,
                  "#1e0a3c",
                ],
                "circle-radius": [
                  "step",
                  ["get", "point_count"],
                  20,
                  10,
                  22,
                  20,
                  24,
                  30,
                  26,
                  40,
                  28,
                  50,
                  30,
                  60,
                  32,
                  70,
                  34,
                  80,
                  36,
                  90,
                  38,
                  100,
                  42,
                ],
                "circle-stroke-width": 2,
                "circle-stroke-color": "white",
              }}
            />

            {/* Метки количества в кластерах */}
            <Layer
              id="cluster-count"
              type="symbol"
              source="events"
              filter={["has", "point_count"]}
              layout={{
                "text-field": "{point_count_abbreviated}",
                "text-size": 12,
              }}
              paint={{ "text-color": "white" }}
            />

            {/* Одиночные маркеры */}
            <Layer
              id="unclustered-point"
              type="circle"
              source="events"
              filter={["!", ["has", "point_count"]]}
              paint={{
                "circle-color": "#3b82f6",
                "circle-radius": 8,
                "circle-stroke-width": 2,
                "circle-stroke-color": "white",
              }}
            />
          </Source>
        )}

        {/* Попап точки: одно или несколько событий */}
        {isMapLoaded && popupState && (
          <Popup
            longitude={popupState.lng}
            latitude={popupState.lat}
            anchor="bottom"
            onClose={handlePopupClose}
            closeOnClick={false}
            closeButton={false}
          >
            <EventPopup
              lat={popupState.lat}
              lng={popupState.lng}
              events={popupState.events}
              onClose={handlePopupClose}
            />
          </Popup>
        )}
      </Map>
    </div>
  );
}
