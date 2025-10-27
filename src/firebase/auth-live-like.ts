"use client";
/**
 * Auth "igual à live":
 * - Lê config de '/__/firebase/init.json' quando disponível (Firebase Hosting).
 * - Se não existir (dev local), cai para process.env (NEXT_PUBLIC_FIREBASE_*).
 * - Persistência compatível com iOS/Safari (session→idb→local→memory).
 * - iOS/iframe ⇒ redirect; desktop tenta popup e faz fallback para redirect.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  type User,
} from "firebase/auth";

async function loadRuntimeFirebaseConfig() {
  try {
    const res = await fetch("/__/firebase/init.json", { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {}
  // Fallback para .env no dev local
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  };
}

let readyPromise: Promise<{ user: User | null; app: FirebaseApp }> | null = null;

const isIOS = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
};

const isIframe = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export async function getAuthReady() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    const cfg = await loadRuntimeFirebaseConfig();
    const app = getApps().length ? getApp() : initializeApp(cfg);
    const auth = getAuth(app);

    // Persistência "amiga" do Safari/redirect
    await setPersistence(auth, browserSessionPersistence)
      .catch(async () => {
        await setPersistence(auth, indexedDBLocalPersistence);
      })
      .catch(async () => {
        await setPersistence(auth, browserLocalPersistence);
      })
      .catch(async () => {
        await setPersistence(auth, inMemoryPersistence);
      });

    // Processa resultado de redirect, se existir (sem travar se não houver)
    try {
      await getRedirectResult(auth);
    } catch {
      /* ignore */
    }

    const user = await new Promise<User | null>((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub();
        resolve(u ?? null);
      });
    });

    return { user, app };
  })();
  return readyPromise;
}

export async function signInWithGoogle() {
  const { app } = await getAuthReady();
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  // iOS e/ou rodando dentro de iframe → redirect é mais confiável
  if (isIOS() || isIframe()) {
    await setPersistence(auth, browserSessionPersistence).catch(() => {});
    return signInWithRedirect(auth, provider);
  }

  // Desktop tenta popup primeiro; se bloquear, cai para redirect
  try {
    await setPersistence(auth, indexedDBLocalPersistence).catch(() => {});
    await signInWithPopup(auth, provider);
  } catch {
    await setPersistence(auth, browserSessionPersistence).catch(() => {});
    await signInWithRedirect(auth, provider);
  }
}

export async function signOutLiveLike() {
  const { app } = await getAuthReady();
  return getAuth(app).signOut();
}
