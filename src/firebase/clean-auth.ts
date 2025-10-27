'use client';

import { auth, db, googleProvider, initAuthPromise } from "./clean-firebase";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserSessionPersistence,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

/** Garante que exista um documento de perfil para o usuário */
export async function ensureUserProfile(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const payload = {
      id: user.uid,
      name: user.displayName || "",
      email: user.email || "",
      avatarUrl: user.photoURL || "",
      phone: user.phoneNumber || "",
      businessName: "",
      businessLogoUrl: "",
      createdAt: new Date().toISOString(),
    };
    await setDoc(ref, payload);
  }
}

function isSafariOrIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isiOS = /iPad|iPhone|iPod/.test(ua);
  const isSafariDesktop = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|FxiOS|CriOS/.test(ua);
  return isiOS || isSafariDesktop;
}

export async function signInWithGooglePopupOrRedirect(): Promise<void> {
  await initAuthPromise;

  if (isSafariOrIos()) {
    console.debug("[auth] Safari/iOS detected, using redirect.");
    await setPersistence(auth, browserSessionPersistence);
    await signInWithRedirect(auth, googleProvider);
    return;
  }

  try {
    console.debug("[auth] Attempting signInWithPopup");
    await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    const code = err?.code || "";
    console.warn("[auth] Popup failed, falling back to redirect. Code:", code);

    if (
      code === "auth/popup-blocked" ||
      code === "auth/popup-closed-by-user" ||
      code === "auth/operation-not-supported-in-this-environment"
    ) {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithRedirect(auth, googleProvider);
    } else {
      throw err;
    }
  }
}

let _handledRedirectOnce = false;
export async function handleRedirectResultOnce(): Promise<void> {
  if (_handledRedirectOnce) return;
  _handledRedirectOnce = true;
  await initAuthPromise;
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await ensureUserProfile(result.user);
    }
  } catch (e) {
    console.warn("getRedirectResult error (ignored):", e);
  }
}


/** Cadastro com e-mail e senha */
export async function signUpWithEmail(email: string, password: string): Promise<User> {
  await initAuthPromise;
  const res = await createUserWithEmailAndPassword(auth, email, password);
  if (!res.user) throw new Error("No user returned on sign up");
  await ensureUserProfile(res.user);
  return res.user;
}

/** Login com e-mail e senha */
export async function signInWithEmailOnly(email: string, password: string): Promise<User> {
  await initAuthPromise;
  const res = await signInWithEmailAndPassword(auth, email, password);
  if (!res.user) throw new Error("No user returned on sign in");
  await ensureUserProfile(res.user);
  return res.user;
}

/** Logout */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
