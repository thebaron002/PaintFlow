// Operações de autenticação limpas: Google popup + email/senha + criação de perfil no Firestore
"use client";

import { auth, db, googleProvider } from "./clean-firebase";
import {
  signInWithPopup,
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

/** Login Google via popup (padrão) */
export async function signInWithGooglePopup(): Promise<User> {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    if (!res.user) throw new Error("No user returned from Google");
    await ensureUserProfile(res.user);
    return res.user;
  } catch (err: any) {
    // Lança erro com mensagem legível
    const msg = err?.code || err?.message || "Erro no Google Sign-In (popup)";
    throw new Error(msg);
  }
}

/** Cadastro com e-mail e senha */
export async function signUpWithEmail(email: string, password: string): Promise<User> {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (!res.user) throw new Error("No user returned on sign up");
    await ensureUserProfile(res.user);
    return res.user;
  } catch (err: any) {
    const msg = err?.code || err?.message || "Erro no sign up";
    throw new Error(msg);
  }
}

/** Login com e-mail e senha */
export async function signInWithEmailOnly(email: string, password: string): Promise<User> {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    if (!res.user) throw new Error("No user returned on sign in");
    await ensureUserProfile(res.user);
    return res.user;
  } catch (err: any) {
    const msg = err?.code || err?.message || "Erro no sign in";
    throw new Error(msg);
  }
}

/** Logout */
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
