'use client';
import React, { useState } from "react";

type Props = {
  mode: "signin" | "signup";
  onSubmit: (email: string, password: string) => Promise<void>;
};

export function AuthForm({ mode, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await onSubmit(email.trim(), password);
    } catch (e: any) {
      setErr(e?.message || e?.code || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{err}</div>}
      <div>
        <label className="block text-sm">Email</label>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border px-2 py-1" />
      </div>
      <div>
        <label className="block text-sm">Senha</label>
        <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded border px-2 py-1" />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-primary text-white py-2 rounded">
        {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
      </button>
    </form>
  );
}
