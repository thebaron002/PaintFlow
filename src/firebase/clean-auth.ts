'use client';

import { auth, googleProvider } from "./clean-firebase";
import { signInWithPopup } from "firebase/auth";
import { createUserProfileIfNotExists } from "./auth-helpers";

export async function signInWithGoogle(): Promise<void> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await createUserProfileIfNotExists(result.user);
    }
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    // Propagate the error so the UI can handle it
    throw error;
  }
}
