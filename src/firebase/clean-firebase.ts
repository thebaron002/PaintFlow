"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./config";


let app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Corrige o problema de domínio de autenticação no ambiente dev
if (typeof window !== 'undefined' && window.location.hostname.includes("cloudworkstations.dev")) {
  auth.useDeviceLanguage();
  auth.config.authDomain = window.location.hostname;
}


export { app, auth, db, googleProvider };
