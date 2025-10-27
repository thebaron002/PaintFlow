
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from './config';
import { Auth, getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const { firebaseApp, auth, firestore } = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
    
    let authInstance: Auth;
    try {
      // initializeAuth is safer when you need to choose persistence manually, especially for SSR.
      authInstance = initializeAuth(app, {
        persistence: [
          indexedDBLocalPersistence,
          browserLocalPersistence,
          browserSessionPersistence,
          inMemoryPersistence
        ]
      });
    } catch (e) {
      // Fallback to getAuth if already initialized (e.g., during hot-reloads)
      authInstance = getAuth(app);
    }
    
    const firestoreInstance = getFirestore(app);

    return { firebaseApp: app, auth: authInstance, firestore: firestoreInstance };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
