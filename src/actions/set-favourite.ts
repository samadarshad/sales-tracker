"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { revalidatePath } from "next/cache";

interface SetFavouriteFormState {
  errors: {
    _form?: string[];
  };
}

export async function setFavourite(
  { trackerId }: { trackerId: string },
  formState: SetFavouriteFormState,
  formData: FormData
): Promise<SetFavouriteFormState> {
  const session = await auth();

  if (!session || !session.user) {
    console.error("You must be signed in to perform this action.");
    return {
      errors: {
        _form: ["You must be signed in to perform this action."],
      },
    };
  }

  await db.favourite.create({
    data: {
      trackerId,
      userId: session?.user.id,
    },
  });

  revalidatePath("/");
  return { errors: {} };
}
