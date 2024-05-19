import type { Favourite } from "@prisma/client";
import { db } from "@/db";

export function fetchFavourite(
  trackerId: string,
  userId: string
): Promise<Favourite | null> {
  return db.favourite.findFirst({
    where: { userId, trackerId },
  });
}
