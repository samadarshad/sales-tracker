"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export async function unsetFavourite(trackerId: string) {
  const session = await auth();

  console.log(session);

  await db.favourite.delete({
    where: {
      userId_trackerId: { trackerId, userId: session.user.id },
    },
  });

  revalidatePath("/");
}
