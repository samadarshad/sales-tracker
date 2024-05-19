import Tracker from "@/components/trackers/tracker";
import { fetchAllTrackers } from "@/db/queries/trackers";

export default async function TrackerList() {
  const trackers = await fetchAllTrackers();

  return (
    <div className="space-y-2">
      {trackers.map((tracker) => {
        return <Tracker key={tracker.id} trackerId={tracker.id} />;
      })}
    </div>
  );
}
