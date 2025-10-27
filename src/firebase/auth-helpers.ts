
'use client';

import {
  signInWithPopup,
  GoogleAuthProvider,
  type Auth,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Firestore } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();

/**
 * Creates a user profile document in Firestore if one doesn't already exist.
 * This prevents overwriting existing user data on subsequent logins.
 * @param firestore - The Firestore instance.
 * @param user - The authenticated Firebase user object.
 */
async function createUserProfileIfNotExists(firestore: Firestore, user: User) {
  const userRef = doc(firestore, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    try {
      await setDoc(userRef, {
        id: user.uid,
        name: displayName,
        email,
        avatarUrl: photoURL,
        phone: '',
        businessName: '',
        businessLogoUrl: '',
      });
    } catch (error) {
      console.error("Error creating user profile:", error);
      // Optionally re-throw or handle the error as needed
      throw new Error("Could not create user profile.");
    }
  }
}

/**
 * Handles the Google sign-in process using a popup.
 * After successful authentication, it ensures a user profile exists.
 * @param auth - The Firebase Auth instance.
 * @param firestore - The Firestore instance.
 * @returns The user object upon successful login and profile creation.
 */
export async function handleSignInWithGoogle(auth: Auth, firestore: Firestore): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Ensure user profile is created before proceeding
    await createUserProfileIfNotExists(firestore, user);
    
    return user;
  } catch (error: any) {
    // Log specific error codes for better debugging
    console.error(`Google sign-in failed with code: ${error.code}`, error);
    
    // Re-throw a more user-friendly error or the original error
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Login process was cancelled.");
    }
    if (error.code === 'auth/cancelled-popup-request') {
        throw new Error("Multiple login attempts detected. Please try again.");
    }
    throw new Error("Google sign-in failed. Please try again.");
  }
}
