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

function SignOutButton() {
  const { user } = useAuth();

  const handleSignOut = async () => {
      try {
          await signOut(auth);
          console.log('Signed out successfully!');
      } catch (error) {
          console.error('Error signing out:', error);
      }
  };

  if (!user) {
      return null; // Don't show if not signed in
  }

  return (
      <button onClick={handleSignOut}>
          Sign Out
      </button>
  );
}

export default function SignInButton() {
  const { user } = useAuth();

  const handleSignIn = async () => {
    const provider = new GithubAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // User is signed in, AuthContext will update
      console.log('Signed in successfully!');
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      // Handle errors (e.g., show a message to the user)
    }
  };

  if (user) {
    return SignOutButton();
  }

  return (
    <button onClick={handleSignIn}>
      Sign in with GitHub
    </button>
  );
}

