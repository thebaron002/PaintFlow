
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { getAuthReady, signInWithGoogle } from "@/firebase/auth-live-like";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [status, setStatus] = useState<"idle" | "authenticating" | "error">("authenticating");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { user } = await getAuthReady();
        if (!mounted) return;
        if (user) {
          router.replace(search.get("callbackUrl") || "/dashboard");
        } else {
          setStatus("idle");
        }
      } catch (e: any) {
        if (!mounted) return;
        setStatus("error");
        setMessage(e?.message || "Falha ao inicializar autenticação.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router, search]);

  async function handleGoogle() {
    try {
      setStatus("authenticating");
      await signInWithGoogle();
      // popup: volta aqui e o onAuthStateChanged resolve; redirect: sai da página e retorna
    } catch (e: any) {
      setStatus("error");
      setMessage(e?.message || "Não foi possível iniciar o login.");
    }
  }

  if (status === "authenticating") {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Logo />
          <p className="text-muted-foreground">Autenticando…</p>
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
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
        <div className="grid gap-4">
          <Button variant="outline" className="w-full" onClick={handleGoogle}>
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
