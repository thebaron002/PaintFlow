
'use client';

import { getAuth, signInWithRedirect, GoogleAuthProvider, User, getRedirectResult } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

export async function handleSignInWithGoogle() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  // Use signInWithRedirect instead of signInWithPopup
  await signInWithRedirect(auth, provider);
}

export async function handleRedirectResult() {
  const auth = getAuth();
  const firestore = getFirestore();
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User successfully signed in.
      const user = result.user;
      await createUserProfile(firestore, user);
      return user;
    }
  } catch (error) {
    console.error('Error during Google sign-in redirect:', error);
  }
  return null;
}

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
