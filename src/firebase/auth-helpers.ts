'use client';

import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase-client';
import type { UserProfile } from '@/app/lib/types';

/**
 * Creates a user profile document in Firestore if one doesn't already exist for the given user.
 * This prevents overwriting existing user data on subsequent logins.
 * @param user The Firebase authenticated user object.
 */
export async function createUserProfileIfNotExists(user: User) {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  // If the user document does not exist, create it.
  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const newUserProfile: Omit<UserProfile, 'id'> & { id: string } = {
      id: user.uid,
      name: displayName || 'New User',
      email: email || '',
      avatarUrl: photoURL || '',
      phone: '',
      businessName: '',
      businessLogoUrl: '',
    };
    await setDoc(userRef, newUserProfile);
  }
}
