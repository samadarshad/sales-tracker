"use server";

import { getUserFromSession } from '@/lib/auth-utils'; // Corrected import path
import { db } from "./../firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore"; // Added writeBatch
import { revalidatePath } from "next/cache";

interface SetFavouriteFormState {
  success?: boolean; // Add success state
  errors: {
    _form?: string[];
  };
}

export async function setFavourite(
  { trackerId, _set }: { trackerId: string; _set: boolean },
  formState: SetFavouriteFormState,
  formData: FormData
): Promise<SetFavouriteFormState> {
  const userId = await getUserFromSession();

  if (!userId) {
    return {
      errors: {
        _form: ["You must be signed in to perform this action."],
      },
    };
  }

  const favouritesCollection = collection(db, "favourites");
  const q = query(
    favouritesCollection,
    where("trackerId", "==", trackerId),
    where("userId", "==", userId)
  );

  try {
    if (_set) {
      // Add a new favourite - Check if it exists first
      const existingSnapshot = await getDocs(q);
      if (existingSnapshot.empty) {
        await addDoc(favouritesCollection, {
          trackerId,
          userId,
          // Optional: add a timestamp
          // createdAt: serverTimestamp()
        });
      } else {
        // Already favourited, maybe return a specific state or just success
        console.log("Favourite already exists for this user and tracker.");
        // Optionally return an error if adding again is unexpected
        // return { errors: { _form: ["Already favourited."] } };
      }
    } else {
      // Remove favourite(s)
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Trying to remove a favourite that doesn't exist
        console.warn("Attempted to remove non-existent favourite.");
        return {
          errors: {
            _form: ["Cannot remove favourite, it does not exist."],
          },
        };
      }

      // Use a batch write to delete all matching documents (handles potential duplicates)
      const batch = writeBatch(db);
      snapshot.docs.forEach((favouriteDoc) => {
        batch.delete(doc(db, "favourites", favouriteDoc.id));
      });
      await batch.commit();
    }

    revalidatePath("/"); // Revalidate the path to update UI
    revalidatePath(`/trackers/${trackerId}`); // Also revalidate the specific tracker page if it exists
    return { errors: {}, success: true }; // Indicate success

  } catch (error) {
    console.error("Error setting favourite:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return {
      errors: {
        _form: [errorMessage],
      },
    };
  }
}
