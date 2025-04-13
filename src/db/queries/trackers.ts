import { db } from "./../../firebase";
import { collection, getDocs, doc, getDoc, getCountFromServer, query, where, Timestamp } from "firebase/firestore"; // Import Timestamp

// Updated TrackerWithData type based on Prisma schema
export type TrackerWithData = {
  id: string;
  websiteUrl: string;
  previewUrl: string;
  faviconUrl: string;
  aiPrompt: string;
  temporary: boolean;
  createdAt: Date; // Use Date type for timestamps
  updatedAt: Date; // Use Date type for timestamps
  authorId: string;
  saleData: any[]; // Keeping this, corresponds to saleDatas in Prisma
  favouritesCount: number; // Calculated field, corresponds to favourites relation count
};

async function countFavourites(trackerId: string): Promise<number> { // Use string for trackerId
  const favouritesCollectionRef = collection(db, "favourites");
  // Create a query to filter by trackerId
  const q = query(favouritesCollectionRef, where("trackerId", "==", trackerId));
  // Get the count directly from the server
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
}

// Helper function to convert Firestore Timestamp to Date
function timestampToDate(timestamp: Timestamp | undefined): Date {
    return timestamp ? timestamp.toDate() : new Date(); // Provide a default or handle undefined case
}

export async function fetchAllTrackers(): Promise<TrackerWithData[]> {
  const trackersCollection = collection(db, "trackers");
  // Add a where clause to filter out temporary trackers server-side
  const q = query(trackersCollection, where("temporary", "==", false));
  const snapshot = await getDocs(q);

  const trackers: TrackerWithData[] = [];
  for (const docSnap of snapshot.docs) { // Renamed doc to docSnap for clarity
    const data = docSnap.data();
    // No need for client-side temporary check anymore
    const favouritesCount = await countFavourites(docSnap.id);
    trackers.push({
      id: docSnap.id,
      websiteUrl: data.websiteUrl || '', // Provide default values or handle potential undefined
      previewUrl: data.previewUrl || '',
      faviconUrl: data.faviconUrl || '',
      aiPrompt: data.aiPrompt || '',
      temporary: data.temporary, // Already filtered, but keep for consistency
      createdAt: timestampToDate(data.createdAt), // Convert Timestamp to Date
      updatedAt: timestampToDate(data.updatedAt), // Convert Timestamp to Date
      authorId: data.authorId || '',
      saleData: data.saleData || [], // Assuming saleData field exists in Firestore
      favouritesCount,
    });
  }
  return trackers;
}

export async function fetchTrackerById(
  trackerId: string
): Promise<TrackerWithData | null> {
  const trackerDocRef = doc(db, "trackers", trackerId); // Renamed trackerDoc to trackerDocRef
  const snapshot = await getDoc(trackerDocRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  // Optionally check if the fetched tracker is temporary
  // if (data.temporary) {
  //   return null; // Or handle as needed
  // }

  const favouritesCount = await countFavourites(trackerId);

  return {
    id: snapshot.id,
    websiteUrl: data.websiteUrl || '', // Provide default values or handle potential undefined
    previewUrl: data.previewUrl || '',
    faviconUrl: data.faviconUrl || '',
    aiPrompt: data.aiPrompt || '',
    temporary: data.temporary,
    createdAt: timestampToDate(data.createdAt), // Convert Timestamp to Date
    updatedAt: timestampToDate(data.updatedAt), // Convert Timestamp to Date
    authorId: data.authorId || '',
    saleData: data.saleData || [], // Assuming saleData field exists in Firestore
    favouritesCount,
  };
}