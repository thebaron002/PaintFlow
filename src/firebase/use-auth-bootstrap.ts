"use client";

import { useEffect, useState } from "react";
import {
  ensureAuthBootstrapped,
  getCurrentUserSync,
  haveInitialUserSync,
} from "./auth-bootstrap";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase-client";

export function useAuthBootstrap() {
  const [initializing, setInitializing] = useState(!haveInitialUserSync());
  const [user, setUser] = useState(getCurrentUserSync());

  useEffect(() => {
    let active = true;

    // garante bootstrap (redirect -> primeiro user)
    ensureAuthBootstrapped().then(() => {
      if (!active) return;
      setInitializing(false);
      setUser(getCurrentUserSync());
    });

    // mantém sincronizado depois do bootstrap
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!active) return;
      setUser(u);
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  return { initializing, user };
}
