
// src/app/login/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import {
  auth, googleProvider, authReadyPromise,
  getRedirectResultOnce, isInIframe, markRedirectPending
} from "@/firebase/firebase-client";
import { signInWithRedirect, signInWithPopup } from "firebase/auth";

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M21.99,12.22 C22,12.82 22,13.43 22,14 C22,18.98 18.5,22 12,22 C5.42,22 0,16.58 0,10 C0,3.42 5.42,0 12,0 C15.44,0 18.2,1.26 20.3,3.28 L17.7,5.82 C16.5,4.76 14.56,3.83 12,3.83 C8.16,3.83 5.03,6.96 5.03,10.8 C5.03,14.64 8.16,17.77 12,17.77 C15,17.77 16.9,16.54 17.84,15.62 C18.6,14.86 19.08,13.77 19.3,12.22 L12,12.22 L12,9.32 L21.99,9.32 Z" />
        </svg>
    )
}

function Content() {
  const router = useRouter();
  const search = useSearchParams();
  const [status, setStatus] = useState<"idle"|"processing"|"ready"|"error">("idle");
  const [message, setMessage] = useState("");

  // processa retorno de redirect e/ou login já existente
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("processing");
      setMessage("Autenticando...");
      // se voltamos com start=google (escape do iframe), executa o redirect imediatamente
      if (search.get("startGoogle") === "1") {
        try {
          markRedirectPending(true);
          await signInWithRedirect(auth, googleProvider);
          return; // navega pro Google
        } catch (e: any) {
          setStatus("error"); setMessage(e?.code || "Falha ao iniciar login (redirect).");
          return;
        }
      }

      // se havia redirect pendente, processa-o uma vez
      if (typeof window !== "undefined" && localStorage.getItem("pf_redirect_pending") === "1") {
        await getRedirectResultOnce();
        markRedirectPending(false);
      }

      const user = await authReadyPromise;
      if (cancelled) return;

      if (user) {
        const callback = search.get("callbackUrl");
        router.replace(callback || "/dashboard");
        setStatus("ready");
      } else {
        setStatus("idle");
      }
    })();
    return () => { cancelled = true; };
  }, [router, search]);

  async function handleGoogle() {
    try {
      // 1) se estamos dentro de iframe, escapar para nova aba com start=google
      if (isInIframe()) {
        const url = new URL(window.location.href);
        url.searchParams.set("startGoogle", "1");
        window.open(url.toString(), "_blank", "noopener,noreferrer"); // quebra sandbox
        return;
      }

      // 2) Mobile/iOS e ambientes que bloqueiam popup → redirect é mais confiável
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
      if (isIOS) {
        markRedirectPending(true);
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      // 3) Desktop fora de iframe → tenta popup primeiro
      await signInWithPopup(auth, googleProvider);
      const user = await authReadyPromise;
      if (user) router.replace("/dashboard");
    } catch (e: any) {
      // Se popup for bloqueado/cancelado, cai pro redirect
      if (String(e?.code || "").includes("popup-")) {
        try {
          markRedirectPending(true);
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (e2: any) {
          setStatus("error");
          setMessage(e2?.code || "Não foi possível iniciar o login com Google.");
        }
      } else {
        setStatus("error");
        setMessage(e?.code || "Não foi possível iniciar o login com Google.");
      }
    }
  }

  if (status === "processing" || status === "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <Logo />
          <p className="text-muted-foreground">{message}</p>
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

        {status === "error" && (
          <div className="mb-4 rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {message}
          </div>
        )}

        <Button className="w-full" variant="outline" onClick={handleGoogle}>
          <GoogleIcon /> Entrar com Google
        </Button>

        {/* Botão de escape manual (útil em ambientes sandboxados) */}
        {isInIframe() && (
          <Button
            className="w-full mt-3"
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("startGoogle", "1");
              window.open(url.toString(), "_blank", "noopener,noreferrer");
            }}
          >
            Abrir em nova aba para login
          </Button>
        )}

        <p className="px-8 text-center text-sm text-muted-foreground mt-6">
            Ao clicar em continuar, você concorda com nossos{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
                Termos de Serviço
            </a>{' '}
            e{' '}
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
    <Suspense fallback={
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
              <Logo />
              <LoaderCircle className="h-6 w-6 animate-spin" />
          </div>
      </div>
    }>
      <Content />
    </Suspense>
  );
}
