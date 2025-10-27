import { onAuthStateChanged, getRedirectResult, type User } from "firebase/auth";
import { auth } from "./firebase-client";

let _bootOnce: Promise<void> | null = null;
let _firstUser: User | null = null;
let _haveInitialUser = false;

// flag global: estamos no meio de um signInWithRedirect
let _redirectPending = false;

export function setRedirectPending(on: boolean) {
  _redirectPending = on;
  try {
    if (typeof window !== "undefined") {
      on ? localStorage.setItem("pf_redirect_pending", "1")
         : localStorage.removeItem("pf_redirect_pending");
    }
  } catch {}
}
export function isRedirectPending() {
  if (_redirectPending) return true;
  try {
    return typeof window !== "undefined" &&
           localStorage.getItem("pf_redirect_pending") === "1";
  } catch { return false; }
}

export function haveInitialUserSync() { return _haveInitialUser; }
export function getCurrentUserSync() { return _firstUser; }

/** Processa (1) resultado do redirect e (2) captura o 1º snapshot de auth – UMA VEZ */
export function ensureAuthBootstrapped(): Promise<void> {
  if (_bootOnce) return _bootOnce;

  _bootOnce = (async () => {
    // 1) processa o resultado do redirect primeiro (se houver)
    try { await getRedirectResult(auth); } catch { /* ignora cancel/sem resultado */ }
    // 2) espera o primeiro estado estável de usuário
    await new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(
        auth,
        (u) => { _firstUser = u; _haveInitialUser = true; unsub(); resolve(); },
        () => { _firstUser = null; _haveInitialUser = true; unsub(); resolve(); }
      );
    });
    // se chegamos aqui, não há mais redirect em curso
    setRedirectPending(false);
  })();

  return _bootOnce;
}
