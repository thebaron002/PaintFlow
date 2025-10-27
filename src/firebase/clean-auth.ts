'use client';

import { auth, db, googleProvider, initAuthPromise } from "./clean-firebase";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
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

/** Detecta Safari (usado para fallback) */
function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
}

/** Usar popup quando possível; se falhar por bloqueio/Safari, usar redirect. */
/** IMPORTANT: garante que initAuthPromise foi aguardado antes de tentar sign-in. */
export async function signInWithGooglePopupOrRedirect(): Promise<void> {
  // garante que persistência foi aplicada
  await initAuthPromise;

  try {
    await signInWithPopup(auth, googleProvider);
    return;
  } catch (err: any) {
    const code = err?.code || err?.message || "";
    console.warn("[auth] signInWithPopup failed:", code, err);

    const shouldRedirect =
      isSafari() ||
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment" ||
      code === "auth/web-storage-unsupported" ||
      // opcional: se popup foi fechado automaticamente
      code === "auth/popup-closed-by-user";

    if (shouldRedirect) {
      // fallback para redirect
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    // se não for um caso elegível para fallback, rethrow para UI
    throw err;
  }
}

/** Processa resultado do redirect (chamar no boot para finalizar o fluxo) */
let _handledRedirectOnce = false;
export async function handleRedirectResultOnce(): Promise<void> {
  if (_handledRedirectOnce) return;
  _handledRedirectOnce = true;

  // garante persistência aplicada antes de processar redirect
  await initAuthPromise;

  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await ensureUserProfile(result.user);
      console.debug("[auth] processed redirect result for user:", result.user.uid);
    }
  } catch (e) {
    // ignora expected errors (ex: usuario cancelou)
    console.warn("[auth] getRedirectResult error (ignored):", e);
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
