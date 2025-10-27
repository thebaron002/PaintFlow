
// src/lib/firebase-client.ts
"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  setPersistence,
  browserPopupPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  getRedirectResult,
  type User,
  type Auth,
} from "firebase/auth";
import { doc, setDoc, getDoc, getFirestore, Firestore } from 'firebase/firestore';


// --- sua config ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};


let app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth singleton, garantindo persistências antes de qualquer operação:
let auth: Auth;
try {
  auth = initializeAuth(app, {
    // ordem importa: tenta IndexedDB, cai pra localStorage, depois memória
    persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence],
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch {
  // já inicializado
  auth = getAuth(app);
}

// redundância segura: seta persistência também se já existia
setPersistence(auth, indexedDBLocalPersistence).catch(async () => {
  try { await setPersistence(auth, browserLocalPersistence); }
  catch { await setPersistence(auth, inMemoryPersistence); }
});

const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// --- util: detecta iframe ---
export const isInIframe = () => {
  try { return typeof window !== "undefined" && window.self !== window.top; }
  catch { return true; } // browsers paranoicos
};

// --- promessa “auth pronto” (1x) ---
let _readyRes: (u: User | null) => void;
let _readyRej: (e: any) => void;
export const authReadyPromise = new Promise<User | null>((res, rej) => {
  _readyRes = res; _readyRej = rej;
});
onAuthStateChanged(auth, (user) => _readyRes(user), (e) => _readyRej(e));

// --- processa getRedirectResult apenas uma vez por carga ---
let _grrRan = false;
export async function getRedirectResultOnce() {
  if (_grrRan) return;
  _grrRan = true;
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      await createUserProfile(db, result.user);
    }
  } catch { /* ignora cancel/sem resultado */ }
}

// bandeira local pra fluxo de redirect
export function markRedirectPending(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) localStorage.setItem("pf_redirect_pending", "1");
  else localStorage.removeItem("pf_redirect_pending");
}


// This helper function creates user profile in Firestore if it doesn't exist.
async function createUserProfile(firestore: Firestore, user: User) {
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


export { app, auth, db, googleProvider };
