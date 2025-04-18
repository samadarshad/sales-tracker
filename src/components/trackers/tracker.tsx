import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faEdit } from "@fortawesome/free-regular-svg-icons";
import { Skeleton, Image, Avatar, Button } from "@nextui-org/react";
import { fetchTrackerById } from "@/db/queries/trackers";
import { notFound } from "next/navigation";
import FavouriteButton from "../favourites/favourite-button";
import { fetchFavourite } from "@/db/queries/favourites";
import { getUserFromSession } from '@/lib/auth-utils';
import { fetchSalesForTracker } from "@/db/queries/sales"; // Import the new query
import TrackerSalesChart from "./tracker-sales-chart"; // Import the new chart component

interface TrackerProps {
  trackerId: string;
}

export default async function Tracker({ trackerId }: TrackerProps) {
  // Fetch tracker, user session, and sales data concurrently
  const [tracker, userId, salesData] = await Promise.all([
    fetchTrackerById(trackerId),
    getUserFromSession(),
    fetchSalesForTracker(trackerId) // Fetch sales data
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
              <FavouriteButton tracker={tracker} favourited={favourited} />
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
          <TrackerSalesChart salesData={salesData} />
        </div>
      </div>
    </div>
  );
}
