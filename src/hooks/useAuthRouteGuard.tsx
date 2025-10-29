
"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export function UseAuthRouteGuard() {
  const { user, loading } = useAuth();
  const pathname = usePathname() || "/";
  const search = useSearchParams()?.toString() || "";
  const router = useRouter();

  // 1) Salva a última rota do dashboard para restaurar depois
  useEffect(() => {
    if (pathname.startsWith("/dashboard")) {
      const full = search ? `${pathname}?${search}` : pathname;
      localStorage.setItem("pf:lastDashboardPath", full);
    }
  }, [pathname, search]);

  // 2) Regras de navegação
  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Não autenticado: se tentar abrir dashboard, manda pra login.
      if (pathname.startsWith("/dashboard")) {
        router.replace("/login");
      }
      return;
    }

    // Autenticado:
    // Só redireciona se estiver em '/' ou '/login' ou '/signup'
    if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/signup")) {
      const last = localStorage.getItem("pf:lastDashboardPath") || "/dashboard";
      router.replace(last);
    }
    // IMPORTANTE: não faz nada nas demais rotas -> assim o reload fica na mesma página
  }, [user, loading, pathname, router]);

  return null;
}
