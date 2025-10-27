
'use client';

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// Define a forma do contexto do Firebase
export interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// Cria o contexto do Firebase
const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

// Props para o FirebaseProvider
interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

/**
 * Provedor que disponibiliza as instâncias do Firebase (app, auth, firestore)
 * para todos os componentes filhos.
 */
export function FirebaseProvider({
  children,
  firebaseApp,
  auth,
  firestore,
}: FirebaseProviderProps) {
  const contextValue = useMemo(
    () => ({
      firebaseApp,
      auth,
      firestore,
    }),
    [firebaseApp, auth, firestore]
  );

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

// Hooks para acessar os serviços do Firebase de forma fácil

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  return useFirebase().firebaseApp;
}

export function useFirestore() {
  return useFirebase().firestore;
}

export function useAuth() {
  const context = useContext(FirebaseContext);
   if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context.auth;
}

// Hook para memoizar referências e queries do Firestore
export function useMemoFirebase<T>(
  factory: () => T,
  deps: React.DependencyList,
  options: { __memo?: boolean } = {}
): T {
    const memoizedValue = useMemo(() => {
        const value = factory();
        if (value && typeof value === 'object') {
            (value as any).__memo = true;
        }
        return value;
    }, deps);

    return memoizedValue;
}
