// "use client" NÃO aqui; este módulo é importado por client components.
import { onAuthStateChanged, getRedirectResult, type User } from "firebase/auth";
import { auth } from "./firebase-client";

// roda uma única vez por carga de app
let _bootPromise: Promise<void> | null = null;
let _bootResolved = false;

// estado atual do usuário (sempre sincronizado após bootstrap)
let _currentUser: User | null = null;
let _haveInitialUser = false;

export function getCurrentUserSync() {
  return _currentUser;
}
export function haveInitialUserSync() {
  return _haveInitialUser;
}

// chama no começo de QUALQUER tela protegida / login
export function ensureAuthBootstrapped(): Promise<void> {
  if (_bootPromise) return _bootPromise;
  _bootPromise = (async () => {
    // 1) processa resultado do redirect (se houver); não falha o bootstrap se não houver
    try { await getRedirectResult(auth); } catch { /* ignore */ }

    // 2) aguarda o PRIMEIRO snapshot de auth (estado inicial coerente)
    await new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(
        auth,
        (u) => {
          _currentUser = u;
          _haveInitialUser = true;
          unsub();
          resolve();
        },
        () => {
          _currentUser = null;
          _haveInitialUser = true;
          unsub();
          resolve();
        }
      );
    });

    _bootResolved = true;
  })();

  return _bootPromise;
}

export function bootResolved() {
  return _bootResolved;
}
