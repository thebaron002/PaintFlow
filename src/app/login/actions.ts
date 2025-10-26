
'use client';

import { getAuth, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

export async function handleSignInWithGoogle() {
  const auth = getAuth();
  const firestore = getFirestore();
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // After successful sign-in, create a user profile in Firestore
    await createUserProfile(firestore, user);

  } catch (error) {
    console.error('Error during Google sign-in:', error);
    // Handle errors here, such as by displaying a notification to the user
  }
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

    