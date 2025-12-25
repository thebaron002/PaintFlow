
'use client';
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "../firebase/clean-firebase";
import { onAuthStateChanged, type User, type Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { createUserProfileIfNotExists } from "@/firebase/auth-helpers";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  auth: Auth;
  getIdToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("AuthProvider: Initializing Auth State Observer");

    // Force local persistence to bypass Safari cookie restrictions on local IPs
    setPersistence(auth, browserLocalPersistence).catch((err: any) => {
      console.error("AuthProvider: Persistence Error:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthProvider: Auth State Changed. User:", user?.email || "null");
      if (user) {
        console.log("AuthProvider: User detected, creating profile if not exists...");
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

  const getIdToken = async () => {
    if (auth.currentUser) {
      return auth.currentUser.getIdToken();
    }
    return null;
  };


  const value: AuthContextValue = {
    user,
    loading,
    auth,
    getIdToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
