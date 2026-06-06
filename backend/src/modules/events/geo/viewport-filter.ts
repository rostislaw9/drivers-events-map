import type { FilterQuery } from "mongoose";

import type { ViewportQueryDto } from "../dto";
import type { EventDocument } from "../schemas/event.schema";
import { buildViewportGeometry, isFullWorld } from "./viewport-geometry";

export function buildViewportFilter(
  viewport: ViewportQueryDto,
): FilterQuery<EventDocument> {
  if (isFullWorld(viewport)) {
    return {};
  }

  return {
    location: {
      $geoWithin: {
        $geometry: buildViewportGeometry(viewport),
      },
    },
  };
}
