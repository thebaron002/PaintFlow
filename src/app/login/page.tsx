
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/useAuth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, auth } = useAuth();
  const [status, setStatus] = useState<"idle" | "authenticating" | "error">("idle");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (loading) {
     return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Logo />
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (user) {
    router.replace("/dashboard");
    return (
       <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Logo />
           <p className="text-muted-foreground">Redirecionando...</p>
          <LoaderCircle className="h-6 w-6 animate-spin" />
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
      router.replace("/dashboard");
    } catch (error: any) {
      setStatus("error");
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setMessage("Invalid email or password.");
      } else {
        setMessage(error.message || "An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo />
          <h1 className="text-2xl font-semibold mt-4">Bem-vindo</h1>
          <p className="text-muted-foreground">Faça login para gerenciar seu negócio de pintura.</p>
        </div>
        
        <form onSubmit={handleLogin} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {status === "error" && (
            <div className="rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {message}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={status === "authenticating"}>
            {status === "authenticating" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : "Login"}
          </Button>
        </form>

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
