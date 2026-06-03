import { useQuery } from "@tanstack/react-query";

import { fetchEvents } from "@/api/events";
import type { ViewportBounds } from "@/shared/types";

export function useEvents(bounds: ViewportBounds | null) {
  return useQuery({
    queryKey: ["events", bounds],
    queryFn: () => fetchEvents(bounds!),
    enabled: bounds !== null,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
