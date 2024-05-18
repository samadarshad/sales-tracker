import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faEdit } from "@fortawesome/free-regular-svg-icons";
import TrackerChartExample from "@/components/trackers/tracker-chart-example";
import { Skeleton } from "@nextui-org/react";

export function Tracker() {
  return (
    <div className="border rounded p-2">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-2">
          <p>Logo</p>
          <h3 className="text-lg font-bold">Tracker Title</h3>
        </div>
        <div className="flex flex-row gap-4">
          <FontAwesomeIcon size="2x" icon={faHeart} />
          <FontAwesomeIcon size="2x" icon={faEdit} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 p-4">
        <div className="col-span-1">
          <Skeleton disableAnimation={true} className="w-full h-52" />
        </div>
        <div className="col-span-3">
          <TrackerChartExample />
        </div>
      </div>
    </div>
  );
}
