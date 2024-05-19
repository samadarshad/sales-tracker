"use client";

import { TrackerWithData } from "@/db/queries/trackers";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@nextui-org/react";
import * as actions from "@/actions";
import { useSession } from "next-auth/react";
import { useFormState } from "react-dom";
import { ToastContainer, toast } from "react-toastify";
import { useEffect } from "react";

export default function FavouriteButton({
  tracker,
  favourited,
}: {
  tracker: TrackerWithData;
  favourited: boolean;
}) {
  const [formState, action] = useFormState(
    actions.setFavourite.bind(null, { trackerId: tracker.id }),
    { errors: {} }
  );

  useEffect(() => {
    toast.error(formState.errors._form?.join(", "));
  }, [formState.errors._form]);
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
        <form action={action}>
          <Button type="submit">
            <p className="text-red-500">{tracker._count.favourites}</p>
            <FontAwesomeIcon
              size="1x"
              icon={faHeart}
              className="text-red-500"
            />
          </Button>
        </form>
      )}
    </>
  );
}
