"use client";

import { TrackerWithData } from "@/db/queries/trackers";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@nextui-org/react";
import * as actions from "@/actions";
import { useSession } from "next-auth/react";

export default function FavouriteButton({
  tracker,
  favourited,
}: {
  tracker: TrackerWithData;
  favourited: boolean;
}) {
  return (
    <>
      {favourited ? (
        <Button onClick={() => actions.unsetFavourite(tracker.id)}>
          <p className="text-red-500">{tracker._count.favourites}</p>
          <FontAwesomeIcon
            size="1x"
            icon={faHeartSolid}
            className="text-red-500"
          />
        </Button>
      ) : (
        <Button onClick={() => actions.setFavourite(tracker.id)}>
          <p className="text-red-500">{tracker._count.favourites}</p>
          <FontAwesomeIcon size="1x" icon={faHeart} className="text-red-500" />
        </Button>
      )}
    </>
  );
}
