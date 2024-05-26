"use client";

import { Input, Spinner } from "@nextui-org/react";
import { useFormStatus } from "react-dom";
import IconButton from "@mui/material/IconButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export default function FormInput({ loaded, clearWebsite, errorMessage }) {
  const { pending } = useFormStatus();
  return (
    <Input
      name="website-url"
      label="Website URL"
      placeholder="e.g. www.udacity.com"
      className="flex items-center justify-center"
      endContent={
        pending ? (
          <Spinner color="default" />
        ) : loaded ? null : (
          <div className="-m-1">
            <IconButton
              type="submit"
              sx={{ p: "10px" }}
              aria-label="search"
              className="flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </IconButton>
          </div>
        )
      }
      isClearable={loaded}
      onClear={loaded ? clearWebsite : undefined}
      isInvalid={!!errorMessage}
      errorMessage={errorMessage}
    />
  );
}
