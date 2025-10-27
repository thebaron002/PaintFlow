'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "../firebase/clean-firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import * as CleanAuth from "../firebase/clean-auth";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<User>;
  signUpWithEmail: (email: string, password: string) => Promise<User>;
  signInWithEmail: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return () => unsub();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    signInWithGoogle: async () => {
      const u = await CleanAuth.signInWithGooglePopup();
      setUser(u);
      return u;
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
