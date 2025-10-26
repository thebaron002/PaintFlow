

'use client';

import { getAuth, signInWithRedirect, GoogleAuthProvider, User, getRedirectResult } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

export async function handleSignInWithGoogle() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  // Use signInWithRedirect instead of signInWithPopup
  await signInWithRedirect(auth, provider);
}

// Note: The primary logic for handling the redirect result and creating the user profile
// has been moved to the more robust `src/firebase/firebase-client.ts` singleton
// to solve the Safari race condition. This file is kept for potential future
// actions but is no longer the main driver of the redirect flow.

