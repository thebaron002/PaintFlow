
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { Auth, getAuth, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';


interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const { firebaseApp, auth, firestore } = useMemo(() => {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // This robust pattern prevents re-initialization errors.
    // It tries to get the existing auth instance, and only initializes a new one
    // if it doesn't exist. This is safer than a simple try/catch.
    let authInstance: Auth;
    try {
        authInstance = getAuth(app);
    } catch (e) {
        authInstance = initializeAuth(app, {
            persistence: indexedDBLocalPersistence
        });
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
