import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  formatCoord,
  formatDate,
  formatSpeed,
  pluralize,
} from "@/shared/lib/utils";
import type { Event } from "@/shared/types";

const PAGE_SIZE = 5;
const LIST_MAX_HEIGHT = 180;

interface EventPopupProps {
  lat: number;
  lng: number;
  events: Event[];
  onClose: () => void;
}

export function EventPopup({ lat, lng, events, onClose }: EventPopupProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const visible = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, events.length));
  }, [events.length]);

  // При смене набора событий сбрасываем счётчик
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [events]);

  // IntersectionObserver на sentinel — подгружаем следующую страницу при появлении
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const title =
    events.length === 1
      ? `Событие #${events[0].id}`
      : `${pluralize(events.length, ["событие", "события", "событий"])} в точке`;

  return (
    <div className="w-full min-w-[240px] text-sm">
      <div className="flex items-start justify-between px-3 pt-3 pb-2 shadow">
        <div>
          <span className="font-semibold text-base">{title}</span>
          <div className="text-xs text-muted-foreground">
            {formatCoord(lat)}, {formatCoord(lng)}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Закрыть"
          className="ml-3"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: LIST_MAX_HEIGHT }}>
        {visible.map((event, idx) => (
          <div key={event.id}>
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-xs">
                  #{event.id} · Объект {event.oid}
                </span>
                <span className="text-xs font-semibold text-blue-600">
                  {formatSpeed(event.sp)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(event.createdAt)}
              </div>
            </div>
            {idx < visible.length - 1 && <Separator />}
          </div>
        ))}

        {/* Sentinel — при попадании в область видимости подгружает следующую страницу */}
        {hasMore && <div ref={sentinelRef} className="h-1" />}
      </div>
    </div>
  );
}
