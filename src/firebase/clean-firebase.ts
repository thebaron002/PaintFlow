// Inicialização limpa do Firebase (cliente)
// Agora exporta initAuthPromise que assegura que a persistência foi configurada
// antes de qualquer operação de sign-in.
"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  GoogleAuthProvider,
  type Auth,
  browserSessionPersistence,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

let app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

/**
 * initAuthPromise:
 * - tenta configurar persistência (indexedDB -> localStorage -> inMemory)
 * - resolve quando a persistência foi aplicada (ou o fallback inMemory)
 * Isso garante que, quando chamarmos signInWithPopup/redirect, a persistência
 * já esteja definida para evitar inconsistências (especialmente em Safari).
 */
export const initAuthPromise = (async () => {
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
    console.debug("[initAuth] using indexedDBLocalPersistence");
  } catch (e1) {
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.debug("[initAuth] using browserLocalPersistence");
    } catch (e2) {
      try {
        await setPersistence(auth, browserSessionPersistence);
        console.debug("[initAuth] using browserSessionPersistence (fallback)");
      } catch (e3) {
        await setPersistence(auth, inMemoryPersistence);
        console.debug("[initAuth] using inMemoryPersistence (last fallback)");
      }
    }
  }
})();

export { app, auth, db, googleProvider };
