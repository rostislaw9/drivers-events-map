import { useCallback, useRef } from "react";

import type { Event } from "@/shared/types";
import { MapWidget } from "@/widgets/Map/MapWidget";
import { StatsDashboard } from "@/widgets/StatsDashboard/StatsDashboard";

export function MapPage() {
  const refetchEventsRef = useRef<(() => void) | null>(null);
  const locateRef = useRef<
    ((lat: number, lng: number, event?: Event) => void) | null
  >(null);

  const handleRefreshReady = useCallback((refetch: () => void) => {
    refetchEventsRef.current = refetch;
  }, []);

  const handleRefreshEvents = useCallback(() => {
    refetchEventsRef.current?.();
  }, []);

  const handleLocateReady = useCallback(
    (locate: (lat: number, lng: number, event?: Event) => void) => {
      locateRef.current = locate;
    },
    [],
  );

  const handleLocate = useCallback(
    (lat: number, lng: number, event?: Event) => {
      locateRef.current?.(lat, lng, event);
    },
    [],
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Панель статистики */}
      <section className="flex-shrink-0 px-6 py-4 bg-card/50">
        <StatsDashboard
          onRefreshEvents={handleRefreshEvents}
          onLocate={handleLocate}
        />
      </section>

      {/* Карта */}
      <main className="flex-1 overflow-hidden px-6 pb-6">
        <MapWidget
          onRefreshReady={handleRefreshReady}
          onLocateReady={handleLocateReady}
        />
      </main>
    </div>
  );
}
