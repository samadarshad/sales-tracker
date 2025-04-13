"use server";

import admin from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function signInWithSession(idToken: string): Promise<void> {
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

    // Set the session cookie
    cookies().set({
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    throw new Error('Failed to sign in');
  }
}