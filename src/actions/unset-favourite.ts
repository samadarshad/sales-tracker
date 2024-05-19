"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export async function unsetFavourite(trackerId: string) {
  const session = await auth();

  if (!session || !session.user) {
    console.error("You must be signed in to perform this action.");
    return;
  }

  await db.favourite.delete({
    where: {
      userId_trackerId: { trackerId, userId: session.user.id },
    },
  });

  revalidatePath("/");
}
