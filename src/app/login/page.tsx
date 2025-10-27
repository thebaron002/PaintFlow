'use client';
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";

function LoginInner() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!loading && user && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || (!loading && user)) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20">
            <Logo />
            <LoaderCircle className="h-8 w-8 animate-spin text-primary mt-4" />
        </div>
      );
  }

  const handleLogin = async () => {
    setErr(null);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setErr(e?.message || e?.code || "An unknown error occurred during sign-in.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20 p-6 text-center">
      <div className="w-full max-w-sm mx-auto">
        <div className="mb-8">
            <Logo />
        </div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Welcome Back</h1>
        <p className="text-muted-foreground mt-2 mb-8">
          Sign in to manage your painting business.
        </p>

        {err && <div className="text-sm text-red-600 mb-4 bg-destructive/10 p-3 rounded-md">{err}</div>}
        
        <Button onClick={handleLogin} size="lg" className="w-full">
            <FcGoogle className="mr-2 h-5 w-5" />
            Sign in with Google
        </Button>
        
        <p className="text-xs text-muted-foreground mt-8">
          By clicking continue, you agree to our{" "}
          <a href="#" className="underline hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // AuthProvider is already in layout.tsx, so we don't need it here.
  return <LoginInner />;
}
