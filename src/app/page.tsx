import TrackerCreateForm from "@/components/trackers/tracker-create-form";
import TrackerList from "@/components/trackers/tracker-list";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <TrackerList />
      <TrackerCreateForm />
    </div>
  );
}
