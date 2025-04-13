import admin from './firebase-admin';
import { cookies } from 'next/headers';

export async function getUserFromSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    return decodedClaims.uid; // Return the user UID
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}