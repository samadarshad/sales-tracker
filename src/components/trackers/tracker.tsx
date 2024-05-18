import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faEdit } from "@fortawesome/free-regular-svg-icons";
import TrackerChartExample from "@/components/trackers/tracker-chart-example";
import { Skeleton, Image, Avatar } from "@nextui-org/react";

export function Tracker() {
  return (
    <div className="border rounded p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-4 items-center">
          <Image
            src="/logo.png"
            alt="logo"
            height={40}
            width={40}
            radius="none"
          />
          <h3 className="text-lg font-bold">Udacity</h3>
        </div>
        <div className="flex flex-row gap-4 items-center">
          <FontAwesomeIcon size="1x" icon={faHeart} />
          <FontAwesomeIcon size="1x" icon={faEdit} />
        </div>
      </div>
      <div className="grid grid-cols-4 py-4">
        <div className="col-span-1">
          <Image
            src="/webpage-preview.png"
            alt="webpage preview"
            radius="none"
          />
        </div>
        <div className="col-span-3">
          <TrackerChartExample />
        </div>
      </div>
    </div>
  );
}
