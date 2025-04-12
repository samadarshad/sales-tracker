import { db } from "./../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function fetchFavourite(
  trackerId: string,
  userId: string
): Promise<any | null> {
  const favouritesCollection = collection(db, "favourites");
  const favouritesQuery = query(
    favouritesCollection,
    where("trackerId", "==", trackerId),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(favouritesQuery);

  if (snapshot.empty) {
    return null;
  }

  // Assuming there's only one matching favourite
  const favouriteDoc = snapshot.docs[0];
  return { id: favouriteDoc.id, ...favouriteDoc.data() };
}
