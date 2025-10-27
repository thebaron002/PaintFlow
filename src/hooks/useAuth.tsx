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

    const bootstrapAuth = async () => {
        try {
            await CleanAuth.handleRedirectResultOnce();
            
            unsub = onAuthStateChanged(auth, (u) => {
                if (mounted) {
                    setUser(u);
                    setLoading(false);
                }
            }, (err) => {
                console.error("[auth] onAuthStateChanged error:", err);
                if (mounted) {
                    setUser(null);
                    setLoading(false);
                }
            });

        } catch (e) {
            console.error("[auth] bootstrap error:", e);
            if (mounted) {
                setLoading(false);
            }
        }
    };
    
    bootstrapAuth();

    return () => {
      mounted = false;
      if (unsub) {
        unsub();
      }
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
