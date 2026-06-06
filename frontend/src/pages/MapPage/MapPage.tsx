import { useCallback, useRef } from "react";

import type { Event } from "@/shared/types";
import { MapWidget, MapWidgetRef } from "@/widgets/Map/MapWidget";
import { StatsDashboard } from "@/widgets/StatsDashboard/StatsDashboard";

export function MapPage() {
  const mapRef = useRef<MapWidgetRef>(null);

  const handleRefreshEvents = useCallback(() => {
    mapRef.current?.refreshEvents();
  }, []);

  const handleLocate = useCallback(
    (lat: number, lng: number, event?: Event) => {
      mapRef.current?.locate(lat, lng, event);
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
        <MapWidget ref={mapRef} />
      </main>
    </div>
  );
}
