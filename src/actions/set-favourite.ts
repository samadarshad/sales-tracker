"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

export async function setFavourite(trackerId: string) {
  const session = await auth();

  console.log(session);

  await db.favourite.create({
    data: {
      trackerId,
      userId: session?.user.id,
    },
  });

  revalidatePath("/");
}
