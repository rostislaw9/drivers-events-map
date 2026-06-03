import { http } from "./http";
import type { Statistics } from "@/shared/types";

export function fetchStatistics(): Promise<Statistics> {
  return http.get<Statistics>("/statistics");
}
