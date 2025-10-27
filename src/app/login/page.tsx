'use client';
import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "../../hooks/useAuth";
import { AuthForm } from "../../components/AuthForm";
import { useRouter } from "next/navigation";

function LoginInner() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } = useAuth();
  const router = useRouter(); // Hook movido para o topo
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [err, setErr] = useState<string | null>(null);

  // quando o user existir, redireciona automaticamente para /dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  // Se o usuário estiver logado e o carregamento concluído, o useEffect acima fará o redirecionamento.
  // Renderizar a UI de login evita o retorno antecipado.
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Entrar</h2>

        {err && <div className="text-sm text-red-600 mb-3">{err}</div>}

        <button
          onClick={async () => {
            setErr(null);
            try {
              await signInWithGoogle();
            } catch (e: any) {
              setErr(e?.message || e?.code || "Erro no login com Google");
            }
          }}
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
                else await signInWithEmail(email, password);
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
    <AuthProvider>
      <LoginInner />
    </AuthProvider>
  );
}
