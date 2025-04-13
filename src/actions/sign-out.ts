"use server";

import { cookies } from 'next/headers';

export async function signOut(): Promise<void> {
  cookies().set({
    name: 'session',
    value: '',
    maxAge: 0, // Expire the cookie immediately
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}