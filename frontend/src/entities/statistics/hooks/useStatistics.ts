import { useQuery } from "@tanstack/react-query";

import { fetchStatistics } from "@/api/statistics";

export function useStatistics() {
  return useQuery({
    queryKey: ["statistics"],
    queryFn: fetchStatistics,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}
