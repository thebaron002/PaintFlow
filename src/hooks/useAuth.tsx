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
    let unsub: (() => void) | null = null;

    (async () => {
      try {
        // 1) Processa redirect result (se voltamos de redirect)
        await CleanAuth.handleRedirectResultOnce();

        // 2) Depois que o redirect foi processado, instala listener e espera o primeiro snapshot
        await new Promise<void>((resolve) => {
          unsub = onAuthStateChanged(
            auth,
            (u) => {
              if (!mounted) return;
              setUser(u);
              // o primeiro callback de onAuthStateChanged é o "estado estável inicial"
              resolve();
            },
            (err) => {
              console.error("[auth] onAuthStateChanged error during bootstrap:", err);
              if (!mounted) return;
              setUser(null);
              resolve();
            }
          );
        });

        // 3) agora já recebemos o estado inicial; define loading false
        if (mounted) setLoading(false);

        // 4) depois do primeiro snapshot, mantemos o listener ativo (unsub já definido)
        // nada mais a fazer aqui; futuras mudanças irão atualizar state via setUser
      } catch (e) {
        console.error("[auth] bootstrap error:", e);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signInWithGoogle: async () => {
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
