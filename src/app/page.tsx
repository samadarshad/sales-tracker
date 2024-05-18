import TrackerCreateForm from "@/components/trackers/tracker-create-form";
import TrackerList from "@/components/trackers/tracker-list";
import Image from "next/image";

export default function Home() {
  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      <div className="col-span-3">
        <TrackerList />
      </div>
      <div>
        <div className="border shadow py-3 px-2">
          <TrackerCreateForm />
        </div>
      </div>
    </div>
  );
}
