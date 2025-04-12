"use server";

import { useAuth } from '@/app/providers';
import { db } from "./../firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
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
  const session = useAuth();

  if (!session || !session.user) {
    return {
      errors: {
        _form: ["You must be signed in to perform this action."],
      },
    };
  }

  const userId = session.user.id;
  const favouritesCollection = collection(db, "favourites");

  if (_set) {
    // Add a new favourite
    await addDoc(favouritesCollection, {
      trackerId,
      userId,
    });
  } else {
    // Find and delete the favourite
    const favouritesQuery = query(
      favouritesCollection,
      where("trackerId", "==", trackerId),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(favouritesQuery);

    if (!snapshot.empty) {
      const favouriteDoc = snapshot.docs[0]; // Assuming one match
      await deleteDoc(doc(db, "favourites", favouriteDoc.id));
    }
  }

  revalidatePath("/");
  return { errors: {} };
}
