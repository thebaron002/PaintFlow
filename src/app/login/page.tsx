// src/app/login/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { auth, googleProvider } from "@/firebase/firebase-client";
import { ensureAuthBootstrapped, setRedirectPending } from "@/firebase/auth-bootstrap";
import { signInWithRedirect, signInWithPopup, UserCredential } from "firebase/auth";
import { createUserProfileIfNotExists } from "@/firebase/auth-helpers";

function useIsomorphicLayoutEffect() {
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch (e) {
      setIsIframe(true); // Assume iframe in case of security errors
    }
  }, []);

  return { isIframe };
}

function Content() {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const clicking = useRef(false);
  const { isIframe } = useIsomorphicLayoutEffect();

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);

      // if we are returning from an iframe escape, start redirect immediately
      if (search.get("startGoogle") === "1" && !isIframe) {
        try {
          setRedirectPending(true);
          await signInWithRedirect(auth, googleProvider);
          return; // This will navigate to Google's sign-in page
        } catch (e: any) {
          setErr(e?.code || "Failed to initiate sign-in (redirect).");
          setRedirectPending(false);
          setLoading(false);
          return;
        }
      }

      await ensureAuthBootstrapped();
      if (!alive) return;

      if (auth.currentUser) {
        router.replace(search.get("callbackUrl") || "/dashboard");
      } else {
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [router, search, isIframe]);

  async function handleGoogle() {
    if (clicking.current) return;
    clicking.current = true;
    setErr(null);

    // 1. If in an iframe, escape to a new tab
    if (isIframe) {
      const url = new URL(window.location.href);
      url.searchParams.set("startGoogle", "1");
      window.open(url.toString(), "_blank", "noopener,noreferrer");
      clicking.current = false;
      return;
    }

    // 2. Mobile/iOS should use redirect
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      try {
        setRedirectPending(true);
        await signInWithRedirect(auth, googleProvider);
        return; // This will navigate away
      } catch (e: any) {
        setErr(e?.code || "Failed to start Google sign-in.");
        setRedirectPending(false);
        clicking.current = false;
        return;
      }
    }

    // 3. Desktop: try popup, fallback to redirect
    try {
      const result: UserCredential = await signInWithPopup(auth, googleProvider);
      await createUserProfileIfNotExists(result.user);
      router.replace(search.get("callbackUrl") || "/dashboard");
    } catch (e: any) {
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        // User closed the popup, do nothing.
      } else if (e.code === 'auth/popup-blocked') {
        // Fallback to redirect if popup is blocked
        try {
          setRedirectPending(true);
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (e2: any) {
          setErr(e2?.code || "Failed to start Google sign-in after popup failure.");
          setRedirectPending(false);
        }
      } else {
        setErr(e?.code || "An unknown error occurred during sign-in.");
      }
      clicking.current = false;
    }
  }
   function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M21.99,12.22 C22,12.82 22,13.43 22,14 C22,18.98 18.5,22 12,22 C5.42,22 0,16.58 0,10 C0,3.42 5.42,0 12,0 C15.44,0 18.2,1.26 20.3,3.28 L17.7,5.82 C16.5,4.76 14.56,3.83 12,3.83 C8.16,3.83 5.03,6.96 5.03,10.8 C5.03,14.64 8.16,17.77 12,17.77 C15,17.77 16.9,16.54 17.84,15.62 C18.6,14.86 19.08,13.77 19.3,12.22 L12,12.22 L12,9.32 L21.99,9.32 Z" />
        </svg>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <Logo />
          <p className="text-muted-foreground">Autenticando...</p>
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo />
          <h1 className="text-2xl font-semibold mt-4">Bem-vindo</h1>
          <p className="text-muted-foreground">Faça login para gerenciar seu negócio de pintura.</p>
        </div>

        {err && <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}
        
        <div className="grid gap-4">
          <Button variant="outline" className="w-full flex items-center gap-2" onClick={handleGoogle}>
            <GoogleIcon />
            Entrar com Google
          </Button>
        </div>

        <p className="px-8 text-center text-sm text-muted-foreground mt-6">
          Ao clicar em continuar, você concorda com nossos{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Termos de Serviço
          </a>{" "}
          e{" "}
          <a href="#" className="underline underline-offset-4 hover:text-primary">
            Política de Privacidade
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <Content />
    </Suspense>
  );
}
