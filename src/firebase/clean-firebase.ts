"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  type Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { firebaseConfig } from "./config";


let app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  // persistence disabled to avoid lease issues in development/multi-tab
});


// Corrige o problema de domínio de autenticação no ambiente Cloud Workstations
if (typeof window !== 'undefined' && window.location.hostname.includes("cloudworkstations.dev")) {
  auth.useDeviceLanguage();
  auth.config.authDomain = window.location.hostname;
}


export { app, auth, db };
