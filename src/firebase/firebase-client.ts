
// src/lib/firebase-client.ts
"use client";

import {
  getRedirectResult,
  onAuthStateChanged,
  GoogleAuthProvider,
  type Auth,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useFirestore } from "./provider";


// This helper function creates user profile in Firestore if it doesn't exist.
async function createUserProfile(firestore: any, user: User) {
  const userRef = doc(firestore, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  // Create a new document only if one doesn't already exist
  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    await setDoc(userRef, {
      id: user.uid,
      name: displayName,
      email,
      avatarUrl: photoURL,
      // Initialize other fields as needed
      phone: '',
      businessName: '',
      businessLogoUrl: '',
    });
  }
}

// --- Redirect result: ensures it's processed ONLY ONCE per session ---
let _redirectResultPromise: Promise<any> | null = null;
export function getRedirectResultOnce(auth: Auth) {
  if (!_redirectResultPromise) {
    const firestore = useFirestore(); // This hook can be used here if needed
    _redirectResultPromise = getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
            await createUserProfile(firestore, result.user);
        }
        // After processing, clear the localStorage "flag"
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem("pf_redirect_pending");
          }
        } catch {}
        return result;
      })
      .catch((error) => {
        console.error("Error getting redirect result:", error);
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem("pf_redirect_pending");
          }
        } catch {}
        return null;
      });
  }
  return _redirectResultPromise;
}

// --- Auth ready: resolves after the FIRST onAuthStateChanged emission ---
// This guarantees we have the initial user state before proceeding.
export const authReadyPromise = (auth: Auth) => new Promise<User | null>((resolve) => {
  const unsub = onAuthStateChanged(auth, (user) => {
    resolve(user);
    unsub(); // Important: we only need the *first* emission.
  });
});

// --- Export the Google provider for use in the login page ---
export const googleProvider = new GoogleAuthProvider();
