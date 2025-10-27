
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { Auth, getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';


interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const { firebaseApp, auth, firestore } = useMemo(() => {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    let authInstance: Auth;
    try {
      authInstance = initializeAuth(app, {
        persistence: [
          indexedDBLocalPersistence,
          browserLocalPersistence,
          browserSessionPersistence,
          inMemoryPersistence
        ]
      });
    } catch (e) {
      authInstance = getAuth(app);
    }
    
    const firestoreInstance: Firestore = getFirestore(app);

    return { firebaseApp: app, auth: authInstance, firestore: firestoreInstance };
  }, []);

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
