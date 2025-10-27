
// src/lib/firebase-client.ts
"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  setPersistence,
  onAuthStateChanged,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  indexedDBLocalPersistence,
  GoogleAuthProvider,
  getRedirectResult,
  type User,
  type Auth,
} from "firebase/auth";
import { firebaseConfig } from "./config";
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';


// --- App singleton ---
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// --- Auth singleton com persistência robusta (Safari-friendly) ---
let auth: Auth;
try {
  // initializeAuth é mais seguro quando você precisa escolher persistências manualmente
  auth = initializeAuth(app, { 
    persistence: [
      indexedDBLocalPersistence, 
      browserLocalPersistence, 
      browserSessionPersistence,
      inMemoryPersistence
    ] 
  });
} catch (e) {
  // Caso já exista um auth (em HMR), apenas recupere
  auth = getAuth(app);
}

async function createUserProfile(user: User) {
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

// --- Redirect result: garantir uma ÚNICA execução por sessão ---
let _redirectResultPromise: Promise<any> | null = null;
export function getRedirectResultOnce() {
  if (!_redirectResultPromise) {
    _redirectResultPromise = getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
            await createUserProfile(result.user);
        }
        // Ao finalizar o processamento do redirect, limpamos a “flag” localStorage, se existir
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem("pf_redirect_pending");
          }
        } catch {}
        return result;
      })
      .catch(() => {
        try {
          if (typeof window !== "undefined") {
            localStorage.removeItem("pf_redirect_pending");
          }
        } catch {}
        return null;
      }); // não propagar erro nesse gate
  }
  return _redirectResultPromise;
}

// --- Auth ready: resolve após o PRIMEIRO onAuthStateChanged ---
let _authReadyResolve: (value: User | null) => void;
export const authReadyPromise = new Promise<User | null>((resolve) => {
  _authReadyResolve = resolve;
});

let firstEmissionCaptured = false;
onAuthStateChanged(auth, (user) => {
  if (!firstEmissionCaptured) {
    firstEmissionCaptured = true;
    _authReadyResolve(user ?? null);
  }
});

// --- Helper de provider ---
export const googleProvider = new GoogleAuthProvider();

// --- Exports principais ---
export { auth };
