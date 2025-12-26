
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";


export default function LoginPage() {
  const router = useRouter();
  const { user, loading, auth } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"idle" | "authenticating" | "error">("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User signed in successfully via redirect
          // router.replace("/dashboard") is handled by the user/loading effect
        }
      } catch (error: any) {
        console.error("Redirect Error:", error);
        setStatus("error");
        setMessage(error.message || "Falha ao autenticar com Google (Redirect).");
      }
    };
    checkRedirectResult();
  }, [auth]);


  if (loading || user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Logo />
          <LoaderCircle className="h-6 w-6 animate-spin" />
          {user && <p className="text-muted-foreground">Redirecionando...</p>}
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("authenticating");
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The useEffect will handle the redirect
    } catch (error: any) {
      setStatus("error");
      if (error.code === 'auth/unauthorized-domain') {
        setMessage("Erro: Domínio não autorizado. Adicione seu IP (192.168.1.183) no Console do Firebase > Autenticação > Configurações > Domínios autorizados.");
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setMessage("Email ou senha inválidos.");
      } else {
        setMessage(error.message || "Ocorreu um erro inesperado.");
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address.",
      });
      return;
    }
    setIsResetting(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      toast({
        title: "Email Sent",
        description: "Check your inbox for a password reset link.",
      });
      setResetEmail("");
      // This will close the dialog, which we can do by finding a way to trigger the close button if needed,
      // but for now, the user can close it manually. A better UX could involve a prop to control the open state.
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send password reset email.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setStatus("authenticating");
    setMessage("");
    const provider = new GoogleAuthProvider();
    try {
      // Usando popup pois redirect falha em Safari com IP local (HTTPS mismatch)
      await signInWithPopup(auth, provider);
      console.log("LoginPage: Google Popup Success");
    } catch (error: any) {
      console.error("Google Auth Error:", error);
      setStatus("error");
      if (error.code === 'auth/unauthorized-domain') {
        setMessage("Erro: Domínio não autorizado. Adicione seu IP (192.168.1.183) no Console do Firebase > Autenticação > Configurações > Domínios autorizados.");
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setMessage("Já existe uma conta com este e-mail. Por favor, faça login com e-mail e senha.");
      } else if (error.code === 'auth/popup-blocked') {
        setMessage("O popup foi bloqueado pelo Safari. Por favor, permita popups para este site.");
      } else {
        setMessage(error.message || "Falha ao entrar com Google.");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-[#F2F1EF] p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-200/30 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm z-10">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="bg-white p-3 rounded-2xl shadow-sm mb-6 border border-zinc-100">
            <Logo />
          </div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tighter">PaintFlow</h1>
          <p className="text-zinc-500 font-medium mt-2">Profissionalize sua gestão de pintura.</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white">
          <form onSubmit={handleLogin} className="grid gap-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  className="rounded-2xl border-zinc-100 focus:border-rose-500 focus:ring-rose-500/20 h-12 bg-white/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Senha</Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="px-0 h-auto text-[10px] font-bold uppercase tracking-widest text-rose-500 transition-all hover:scale-105">
                        Esqueceu?
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[32px] border-none shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Recuperar Senha</DialogTitle>
                        <DialogDescription className="text-zinc-500 font-medium">
                          Enviaremos um link seguro para o seu e-mail.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-6">
                        <Label htmlFor="reset-email" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Seu Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="m@example.com"
                          className="rounded-2xl border-zinc-100 h-12 mt-2"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                        />
                      </div>
                      <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                          <Button type="button" variant="ghost" className="rounded-2xl font-bold h-12">
                            Cancelar
                          </Button>
                        </DialogClose>
                        <Button onClick={handlePasswordReset} disabled={isResetting} className="bg-zinc-950 text-white rounded-2xl font-bold h-12 px-8">
                          {isResetting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Enviar Link
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  className="rounded-2xl border-zinc-100 focus:border-rose-500 focus:ring-rose-500/20 h-12 bg-white/50"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {status === "error" && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold text-rose-600 animate-in fade-in slide-in-from-top-2">
                {message}
              </div>
            )}

            <Button type="submit" className="w-full bg-rose-500 rounded-2xl font-black h-14 text-white hover:bg-rose-600 transition-all shadow-[0_8px_20px_rgba(244,63,94,0.2)] active:scale-[0.98]" disabled={status === "authenticating"}>
              {status === "authenticating" ? <LoaderCircle className="h-5 w-5 animate-spin" /> : "Entrar Agora"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-100"></span>
            </div>
            <span className="relative bg-[#fafafa] px-4 mx-auto block w-fit text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Ou use sua rede social</span>
          </div>

          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full rounded-2xl font-bold h-14 border-zinc-100 bg-white hover:bg-zinc-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-sm"
            disabled={status === "authenticating"}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </div>

        <p className="mt-8 text-center text-sm font-medium text-zinc-500">
          Novo por aqui?{' '}
          <Link href="/signup" className="text-zinc-900 font-bold underline decoration-rose-500/30 underline-offset-4 hover:decoration-rose-500 transition-all">
            Crie sua conta
          </Link>
        </p>

        <div className="mt-10 pt-6 border-t border-zinc-200/50">
          <p className="text-[10px] text-center text-zinc-400 font-bold leading-relaxed uppercase tracking-widest px-4">
            Ao continuar, você aceita nossos{" "}
            <a href="#" className="text-zinc-600 hover:text-black transition-colors">Termos</a>{" "}
            e{" "}
            <a href="#" className="text-zinc-600 hover:text-black transition-colors">Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
