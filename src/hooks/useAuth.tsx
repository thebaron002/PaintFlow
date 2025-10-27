'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "../firebase/clean-firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import * as CleanAuth from "../firebase/clean-auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1) Processa redirect result (se o usuário voltou de um redirect)
    (async () => {
      try {
        await CleanAuth.handleRedirectResultOnce();
      } catch (e) {
        console.warn("handleRedirectResultOnce erro:", e);
      } finally {
        // 2) então instala o listener de auth
        if (!mounted) return;
        const unsub = onAuthStateChanged(
          auth,
          (u) => {
            setUser(u);
            setLoading(false);
          },
          (err) => {
            console.error("onAuthStateChanged error", err);
            setUser(null);
            setLoading(false);
          }
        );
        // guarda unsub no closure para cleanup
        (AuthProvider as any).__unsub = unsub;
      }
    })();

    return () => {
      mounted = false;
      const unsub = (AuthProvider as any).__unsub;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signInWithGoogle: async () => {
      // função exposta que vai tentar popup e ggf redirect
      await CleanAuth.signInWithGooglePopupOrRedirect();
    },
    signUpWithEmail: async (email, password) => {
      const u = await CleanAuth.signUpWithEmail(email, password);
      setUser(u);
      return u;
    },
    signInWithEmail: async (email, password) => {
      const u = await CleanAuth.signInWithEmailOnly(email, password);
      setUser(u);
      return u;
    },
    signOut: async () => {
      await CleanAuth.signOutUser();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
