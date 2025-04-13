"use client";
import {
  Button,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@nextui-org/react";

import React from 'react';
import { signInWithPopup, GithubAuthProvider, signOut } from 'firebase/auth';
import { auth } from '@/firebase'; // Adjust path
import { useAuth } from '@/app/providers'; // Adjust path
import { signInWithSession } from '@/actions/sign-in'; // Import the server action
import { signOut as serverSignOut } from '@/actions/sign-out'; // Import server sign-out action

function SignOutButton() {
  const { user } = useAuth();

  const handleSignOut = async () => {
      try {
          // Sign out from Firebase client-side
          await signOut(auth);
          // Clear the server session cookie
          await serverSignOut();
          console.log('Signed out successfully from client and server!');
      } catch (error) {
          console.error('Error signing out:', error);
      }
  };

  if (!user) {
      return null; // Don't show if not signed in
  }

  // Display user info and sign out button
  return (
    <Popover placement="left">
      <PopoverTrigger>
        <Avatar src={user.photoURL || ''} />
      </PopoverTrigger>
      <PopoverContent>
        <div className="p-4">
          <Button color="danger" variant="flat" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Renamed component to HeaderAuth for clarity
export default function HeaderAuth() {
  const { user } = useAuth();

  const handleSignIn = async () => {
    const provider = new GithubAuthProvider();
    try {
      // 1. Sign in with Firebase client-side
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (firebaseUser) {
        // 2. Get the ID token
        const idToken = await firebaseUser.getIdToken();
        // 3. Call the server action to create the session cookie
        await signInWithSession(idToken);
        console.log('Signed in successfully and session cookie set!');
      } else {
         console.error('Firebase user not found after sign-in.');
         // Handle case where user is null after popup
      }

    } catch (error) {
      console.error('Error during sign in process:', error);
      // Handle errors (e.g., show a message to the user)
    }
  };

  // Render the sign-out button if user is logged in, otherwise the sign-in button
  return (
    <div>
      {user ? (
        <SignOutButton />
      ) : (
        <Button onClick={handleSignIn} color="secondary" variant="flat">
          Sign In
        </Button>
      )}
    </div>
  );
}

