import { db } from "./../../firebase";
import { collection, getDocs, doc, getDoc, getCountFromServer, query, where } from "firebase/firestore";

export type TrackerWithData = {
  id: string;
  name: string;
  icon: string;
  image: string;
  saleData: any[]; // Adjust type as needed
  favouritesCount: number;
  temporary: boolean;
  faviconUrl?: string;
  websiteUrl?: string;
  previewUrl?: string;
  authorId?: string;
  aiPrompt?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  [key: string]: any; // Allow additional properties
};

async function countFavourites(trackerId: any): Promise<number> {
  const favouritesCollectionRef = collection(db, "favourites");
  // Create a query to filter by trackerId
  const q = query(favouritesCollectionRef, where("trackerId", "==", trackerId));
  // Get the count directly from the server
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

export async function fetchAllTrackers(): Promise<TrackerWithData[]> {
  const trackersCollection = collection(db, "trackers");
  const snapshot = await getDocs(trackersCollection);

  const trackers: TrackerWithData[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.temporary) {
      const favouritesCount = await countFavourites(doc.id);
      trackers.push({
        id: doc.id,
        name: data.name,
        icon: data.icon,
        image: data.image,
        saleData: data.saleData || [],
        favouritesCount,
        temporary: data.temporary,
      });
    }
  }
  return trackers;
}

export async function fetchTrackerById(
  trackerId: string
): Promise<TrackerWithData | null> {
  const trackerDoc = doc(db, "trackers", trackerId);
  const snapshot = await getDoc(trackerDoc);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  const favouritesCount = await countFavourites(trackerId);

  return {
    id: snapshot.id,
    name: data.name,
    icon: data.icon,
    image: data.image,
    saleData: data.saleData || [],
    favouritesCount,
    temporary: data.temporary,
  };
}