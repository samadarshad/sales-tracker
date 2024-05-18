"use client";
import {
  Button,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@nextui-org/react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function HeaderAuth() {
  const session = useSession();

  let authContent: React.ReactNode;

  if (session.status === "loading") {
    authContent = null;
  } else if (session.data?.user) {
    authContent = (
      <Popover placement="left">
        <PopoverTrigger>
          <Avatar src={session.data.user.image || ""} />
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col gap-2 p-4">
            <Button color="primary" variant="flat">
              My trackers
            </Button>
            <Button color="primary" variant="flat">
              Favourites
            </Button>
            <Button color="secondary" variant="flat" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  } else {
    authContent = (
      <>
        <Button color="primary" variant="flat" onClick={() => signIn()}>
          Sign In
        </Button>
      </>
    );
  }

  return authContent;
}
