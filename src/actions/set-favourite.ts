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
  { trackerId, _set }: { trackerId: string; _set: boolean },
  formState: SetFavouriteFormState,
  formData: FormData
): Promise<SetFavouriteFormState> {
  const session = await auth();

  if (!session || !session.user) {
    return {
      errors: {
        _form: ["You must be signed in to perform this action."],
      },
    };
  }

  if (_set) {
    await db.favourite.create({
      data: {
        trackerId,
        userId: session?.user.id,
      },
    });
  } else {
    await db.favourite.delete({
      where: {
        userId_trackerId: { trackerId, userId: session.user.id },
      },
    });
  }

  revalidatePath("/");
  return { errors: {} };
}
