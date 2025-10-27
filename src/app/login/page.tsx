
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
  
    // If we are in an iframe, don't try popup — force redirect flow via new tab
    if (isIframe) {
      const url = new URL(window.location.href);
      url.searchParams.set("startGoogle", "1");
      window.open(url.toString(), "_blank", "noopener,noreferrer");
      clicking.current = false;
      return;
    }
  
    try {
      setRedirectPending(true); // Optimistically set pending for fallback
  
      // First, try popup (more user-friendly on desktop)
      try {
        const result: UserCredential = await signInWithPopup(auth, googleProvider);
        await createUserProfileIfNotExists(result.user);
        setRedirectPending(false); // Popup succeeded, clear pending flag
        router.replace(search.get("callbackUrl") || "/dashboard");
        return; // Success
      } catch (popupErr: any) {
        // If popup fails (e.g., blocked), log it and fall through to redirect
        console.warn("signInWithPopup failed, falling back to redirect:", popupErr);
        if (popupErr.code !== 'auth/popup-closed-by-user' && popupErr.code !== 'auth/cancelled-popup-request') {
           // Fallback to redirect for other popup errors (like auth/popup-blocked)
           await signInWithRedirect(auth, googleProvider);
           return; // This will navigate away
        } else {
           // If user just closed the popup, don't do anything else.
           setRedirectPending(false);
           clicking.current = false;
        }
      }
    } catch (e: any) {
      setRedirectPending(false);
      console.error("Error during Google sign-in:", e);
      setErr(e?.code || e?.message || "Could not initiate sign-in.");
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
