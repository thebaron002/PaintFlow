'use client';
import { auth, db, googleProvider } from "./clean-firebase";
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
  // detecta Safari excluindo Chrome/Chromium/Edge
  return /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
}

/** Tenta abrir popup; em casos de erro conhecidos (popup bloqueado / ambiente/ safari) faz redirect fallback */
export async function signInWithGooglePopupOrRedirect(): Promise<void> {
  // Prefer popup - é a melhor UX
  try {
    await signInWithPopup(auth, googleProvider);
    // signInWithPopup resolve e onAuthStateChanged (no provider) tratará o usuário.
    return;
  } catch (err: any) {
    const code = err?.code || err?.message || "";
    // Erros que justificam tentar redirect:
    const shouldRedirectFallback = isSafari() ||
      code === "auth/popup-blocked" ||
      code === "auth/operation-not-supported-in-this-environment" ||
      code === "auth/web-storage-unsupported" ||
      // em alguns casos Safari reporta popup-closed-by-user automaticamente; opcionalmente tratar
      code === "auth/popup-closed-by-user";

    console.warn("Google popup failed:", code, err);

    if (shouldRedirectFallback) {
      // fallback para redirect — o navegador será navegated para Google
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    // se não quisermos fallback (usuario fechou popup manualmente), rethrow para UI mostrar mensagem
    throw err;
  }
}

/** Se usar redirect fallback, chame isso ao boot do app para processar o resultado */
export async function handleRedirectResultOnce(): Promise<void> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      // Cria perfil caso necessário
      await ensureUserProfile(result.user);
    }
  } catch (e) {
    // ignora cancel/erros expected
    console.warn("getRedirectResult erro:", e);
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
