'use client';
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { AuthForm } from "../../components/AuthForm";
import { useRouter } from "next/navigation";
import {
  signInWithRedirect,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase/clean-firebase";

const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
};

async function idbAvailable() {
  try {
    // @ts-ignore
    const _ = indexedDB && (indexedDB.databases ? await indexedDB.databases() : true);
    return true;
  } catch {
    return false;
  }
}

function LoginInner() {
  const { user, loading, signInWithGoogle, signUpWithEmail } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [err, setErr] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');

  // Ref para garantir que o redirecionamento aconteça apenas uma vez.
  const redirectedRef = useRef(false);

  // Redireciona para o dashboard se o usuário estiver logado E a inicialização estiver completa.
  useEffect(() => {
    if (!loading && user && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace("/dashboard");
    }
  }, [user, loading]);

  // Enquanto a autenticação está sendo verificada (incluindo o processamento de redirect),
  // exibe um loader para evitar que a UI de login apareça desnecessariamente.
  if (loading || user) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  const handleGoogle = async () => {
    try {
      if (window.self !== window.top) {
        const url = new URL(window.location.href);
        url.searchParams.set("startGoogle", "1");
        window.open(url.toString(), "_blank", "noopener,noreferrer");
        return;
      }
      
      if (isIOS() || !(await idbAvailable())) {
        await setPersistence(auth, browserSessionPersistence);
      }

      const ua = navigator.userAgent;
      const onDesktop = !/Mobile|Android|iP(ad|hone|od)/i.test(ua);
      if (onDesktop) {
        try {
          await signInWithPopup(auth, googleProvider);
          return;
        } catch (e: any) {
          if (!String(e?.code || "").includes("popup-")) throw e;
        }
      }

      // setRedirectPending(true); // You may have a global state for this
      await signInWithRedirect(auth, googleProvider);

    } catch (e: any) {
      // setRedirectPending(false);
      setStatus("error");
      setMessage(e?.code || "Não foi possível iniciar o login.");
      setErr(e?.code || "Não foi possível iniciar o login.");
    }
  };
  
  // Se o usuário estiver logado, o useEffect acima irá redirecioná-lo.
  // Renderizar o formulário de login apenas se não houver usuário após o carregamento.
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Entrar</h2>

        {err && <div className="text-sm text-red-600 mb-3">{err}</div>}

        <button
          onClick={handleGoogle}
          className="w-full border py-2 rounded mb-4 flex items-center justify-center gap-2"
        >
          Entrar com Google
        </button>

        <div className="text-center text-sm text-muted mb-3">ou</div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm">{mode === "signin" ? "Entrar com e-mail" : "Criar conta"}</div>
            <button className="text-xs underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
              {mode === "signin" ? "Criar conta" : "Já tem conta?"}
            </button>
          </div>

          <AuthForm
            mode={mode}
            onSubmit={async (email, password) => {
              setErr(null);
              try {
                if (mode === "signup") await signUpWithEmail(email, password);
                else await useAuth().signInWithEmail(email, password);
              } catch (e: any) {
                throw e;
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function LoginPageWrapper() {
  return (
      <LoginInner />
  );
}
