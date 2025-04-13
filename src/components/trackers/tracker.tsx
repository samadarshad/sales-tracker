import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faEdit } from "@fortawesome/free-regular-svg-icons";
import TrackerChartExample from "@/components/trackers/tracker-chart-example";
import { Skeleton, Image, Avatar, Button } from "@nextui-org/react";
import { fetchTrackerById } from "@/db/queries/trackers";
import { notFound } from "next/navigation";
import { setFavourite } from "@/actions/set-favourite";
import FavouriteButton from "../favourites/favourite-button";
import { fetchFavourite } from "@/db/queries/favourites";
import { getUserFromSession } from '@/lib/auth-utils';

interface TrackerProps {
  trackerId: string;
}

export default async function Tracker({ trackerId }: TrackerProps) {
  const [tracker, userId] = await Promise.all([
    fetchTrackerById(trackerId),
    getUserFromSession()
  ]);

  if (!tracker) {
    notFound();
  }

  let favourited: boolean = false;
  if (userId) {
    favourited = !!(await fetchFavourite(trackerId, userId));
  }

  return (
    <div className="border rounded p-4">
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-4 items-center">
          <Image
            src={tracker.faviconUrl}
            alt="logo"
            height={40}
            width={40}
            radius="none"
          />
          <h3 className="text-lg font-bold">{tracker.websiteUrl}</h3>
        </div>
        <div className="flex flex-row gap-4 items-center">
          <div className="flex flex-row gap-1 items-center">
            {userId && (
              <FavouriteButton tracker={tracker} favourited={favourited} />
            )}
            {!userId && (
              <div className="w-[36px] h-[36px]"></div>
            )}
          </div>
          <Button>
            <FontAwesomeIcon
              size="1x"
              icon={faEdit}
              className="text-amber-800"
            />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-4 py-4">
        <div className="col-span-1">
          <Image src={tracker.previewUrl} alt="webpage preview" radius="none" />
        </div>
        <div className="col-span-3">
          <TrackerChartExample />
        </div>
      </div>
    </div>
  );
}
