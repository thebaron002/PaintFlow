'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "../firebase/clean-firebase";
import { onAuthStateChanged, type User, type Auth } from "firebase/auth";
import { createUserProfileIfNotExists } from "@/firebase/auth-helpers";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  auth: Auth;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await createUserProfileIfNotExists(user);
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    auth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
