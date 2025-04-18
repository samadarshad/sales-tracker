import { db } from "./../../firebase";
import { collection, query, where, getDocs, orderBy, Timestamp, doc } from "firebase/firestore";

export interface Sale {
    id: string;
    date: Date;
    result: number; // Assuming result is the percentage
    trackerRef: string;
}

export async function fetchSalesForTracker(trackerId: string): Promise<Sale[]> {
    const salesCol = collection(db, "sales");
    // Create a document reference for the trackerId
    const trackerRef = doc(db, "trackers", trackerId);
    const q = query(
        salesCol,
        where("trackerRef", "==", trackerRef),
        orderBy("date", "asc")
    );

    const querySnapshot = await getDocs(q);
    const salesData: Sale[] = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert Firestore Timestamp to JavaScript Date object
        const date = (data.date as Timestamp).toDate();
        salesData.push({
            id: doc.id,
            date: date,
            result: data.result as number,
            trackerRef: (data.trackerRef.id) as string, // Store tracker ID string
        });
    });

    return salesData;
}
