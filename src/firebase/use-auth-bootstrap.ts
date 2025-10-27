"use client";
import { useEffect, useState } from "react";
import { auth } from "./firebase-client";
import { onAuthStateChanged } from "firebase/auth";
import {
  ensureAuthBootstrapped,
  getCurrentUserSync,
  haveInitialUserSync,
  isRedirectPending,
} from "./auth-bootstrap";

export function useAuthBootstrap() {
  const [initializing, setInitializing] = useState(!haveInitialUserSync());
  const [user, setUser] = useState(getCurrentUserSync());
  const [redirectPending, setRedirectPending] = useState(isRedirectPending());

  useEffect(() => {
    let alive = true;
    ensureAuthBootstrapped().then(() => {
      if (!alive) return;
      setInitializing(false);
      setUser(getCurrentUserSync());
      setRedirectPending(isRedirectPending());
    });
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!alive) return;
      setUser(u);
      setRedirectPending(isRedirectPending());
    });
    return () => { alive = false; unsub(); };
  }, []);

  return { initializing, user, redirectPending };
}
