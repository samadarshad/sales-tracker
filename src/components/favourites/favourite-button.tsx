"use client";

import { TrackerWithData } from "@/db/queries/trackers";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@nextui-org/react";
import * as actions from "@/actions";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { useEffect, useOptimistic, startTransition } from "react"; // Import useOptimistic and startTransition

export default function FavouriteButton({
  tracker,
  favourited,
}: {
  tracker: TrackerWithData;
  favourited: boolean;
}) {
  // Optimistic state for favourited status and count
  const [optimisticFavourited, setOptimisticFavourited] = useOptimistic(
    favourited,
    (state) => !state // Toggle function
  );
  const [optimisticCount, setOptimisticCount] = useOptimistic(
    tracker.favouritesCount,
    (state, amount) => state + (amount as number) // Add/subtract function
  );

  const [formState, action] = useFormState(
    actions.setFavourite.bind(null, {
      trackerId: tracker.id,
      _set: !favourited, // Base the action on the original prop, not optimistic state
    }),
    { errors: {} }
  );

  useEffect(() => {
    if (formState.errors._form) {
      toast.error(formState.errors._form?.join(", "));
    }
  }, [formState.errors]);

  // Function to handle form submission with optimistic updates
  const handleFormAction = async (formData: FormData) => {
    startTransition(() => {
      setOptimisticFavourited(!optimisticFavourited); // Toggle optimistic favourited state
      setOptimisticCount(optimisticFavourited ? -1 : 1); // Update optimistic count
    });
    // Call the original server action
    action(formData);
  };

  return (
    // Use the handleFormAction for the form's action
    <form action={handleFormAction}>
      <Button type="submit" aria-label="Favourite">
        {optimisticFavourited ? ( // Use optimistic state for UI
          <>
            <p className="text-red-500">{optimisticCount}</p> {/* Use optimistic count */}
            <FontAwesomeIcon
              size="1x"
              icon={faHeartSolid}
              className="text-red-500"
            />
          </>
        ) : (
          <>
            <p className="text-red-500">{optimisticCount}</p> {/* Use optimistic count */}
            <FontAwesomeIcon
              size="1x"
              icon={faHeart}
              className="text-red-500"
            />
          </>
        )}
      </Button>
    </form>
  );
}
