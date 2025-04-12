import { db } from "./../../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export type TrackerWithData = {
  id: string;
  name: string;
  icon: string;
  image: string;
  saleData: any[]; // Adjust type as needed
  favouritesCount: number;
  temporary: boolean;
};

export async function fetchAllTrackers(): Promise<TrackerWithData[]> {
  const trackersCollection = collection(db, "trackers");
  const snapshot = await getDocs(trackersCollection);

  const trackers: TrackerWithData[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.temporary) {
      const favouritesCount = (data.favourites || []).length || 0;
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
  const favouritesCount = (data.favourites || []).length || 0;

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