
// src/app/login/page.tsx
"use client";
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from "react";
import { useAuth, useFirestore } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { handleSignInWithGoogle } from "@/firebase/auth-helpers";

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M21.99,12.22 C22,12.82 22,13.43 22,14 C22,18.98 18.5,22 12,22 C5.42,22 0,16.58 0,10 C0,3.42 5.42,0 12,0 C15.44,0 18.2,1.26 20.3,3.28 L17.7,5.82 C16.5,4.76 14.56,3.83 12,3.83 C8.16,3.83 5.03,6.96 5.03,10.8 C5.03,14.64 8.16,17.77 12,17.77 C15,17.77 16.9,16.54 17.84,15.62 C18.6,14.86 19.08,13.77 19.3,12.22 L12,12.22 L12,9.32 L21.99,9.32 Z" />
        </svg>
    )
}

function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const { auth, user, isUserLoading } = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    // If auth state is still loading, wait.
    if (isUserLoading) {
      return;
    }
    // If user is logged in, redirect them.
    if (user) {
      const callback = search.get("callbackUrl");
      router.replace(callback || "/dashboard");
    }
  }, [user, isUserLoading, router, search]);

  const handleGoogle = async () => {
    if (!auth || !firestore) {
      setStatus("error");
      setMessage("Serviços de autenticação não estão prontos. Tente novamente em um instante.");
      return;
    }

    setStatus("processing");
    setMessage("Aguardando autenticação do Google...");

    try {
      await handleSignInWithGoogle(auth, firestore);
      // The useEffect above will handle the redirect once the `user` state is updated.
    } catch (e: any) {
      setStatus("error");
      setMessage(e.message || "Não foi possível iniciar o login com Google.");
      // If the error is not critical, we might want to revert to idle state
      if (e.message === "Login process was cancelled." || e.message === "Multiple login attempts detected. Please try again.") {
        setTimeout(() => setStatus("idle"), 2000);
      }
    }
  };

  // Show a loading screen while auth state is being determined.
  if (isUserLoading || user) {
    return (
       <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
              <Logo />
              <p className="text-muted-foreground">
                {user ? 'Login bem-sucedido! Redirecionando...' : 'Inicializando autenticação...'}
              </p>
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
        
        {status === "processing" ? (
           <div className="flex flex-col items-center justify-center text-center space-y-4">
              <p className="text-muted-foreground">{message}</p>
              <LoaderCircle className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogle}
                disabled={status !== 'idle'}
              >
                <GoogleIcon />
                Entrar com Google
              </Button>
            </div>
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
          </>
        )}
      </div>
    </div>
  );
}


export default function LoginPageWrapper() {
  return (
    <Suspense fallback={
        <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
              <Logo />
              <LoaderCircle className="h-6 w-6 animate-spin" />
          </div>
      </div>
    }>
      <LoginPage />
    </Suspense>
  );
}
