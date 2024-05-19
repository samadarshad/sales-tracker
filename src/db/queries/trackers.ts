import type { Tracker } from "@prisma/client";
import { db } from "@/db";

export type TrackerWithData = Tracker & {
  _count: { favourites: number };
};

export function fetchTrackersBySearchTerm() {
  // include name, icon, image, sale-data
}

export function fetchAllTrackers(): Promise<TrackerWithData[]> {
  // include name, icon, image, sale-data, favourite count
  return db.tracker.findMany({
    include: {
      _count: {
        select: {
          favourites: true,
        },
      },
    },
  });
}

export function fetchTrackerById(
  trackerId: string
): Promise<TrackerWithData | null> {
  return db.tracker.findFirst({
    where: { id: trackerId },
    include: {
      _count: {
        select: {
          favourites: true,
        },
      },
    },
  });
}
