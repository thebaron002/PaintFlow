
// src/app/dashboard/layout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { auth, authReadyPromise, getRedirectResultOnce } from "@/firebase/firebase-client";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Calendar,
  LayoutDashboard,
  DollarSign,
  PanelLeft,
  Landmark,
  LoaderCircle,
  Settings,
  Users,
  User as UserIcon, // Renamed to avoid conflict with Firebase User type
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
import { Logo } from "@/components/logo";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";


const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendar" },
  { href: "/dashboard/finance", icon: DollarSign, label: "Finance" },
  { href: "/dashboard/payroll", icon: Landmark, label: "Payroll" },
  { href: "/dashboard/crew", icon: Users, label: "Crew" },
  { href: "/dashboard/profile", icon: UserIcon, label: "Profile" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const BottomNavBar = () => {
  const pathname = usePathname();
  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t">
      <div className="grid h-full max-w-lg grid-cols-8 mx-auto font-medium">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "inline-flex flex-col items-center justify-center px-5 hover:bg-muted group",
              pathname.startsWith(href) && href !== '/dashboard' || pathname === href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<"boot"|"waiting"|"ready">("boot");
  const [user, setUser] = useState<User | null>(null);

  // Passo 1: garantir que redirect foi processado + auth pronto (uma vez)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhase("waiting");
      try {
        // Sempre aguarde ambos antes de decidir rota
        await Promise.all([
          getRedirectResultOnce(),
          authReadyPromise,
        ]);
        if (cancelled) return;

        // Passo 2: agora ouvimos mudanças de usuário normalmente
        const unsub = onAuthStateChanged(auth, (u) => {
          if (cancelled) return;
          setUser(u);
          setPhase("ready");
        });

        return () => unsub();
      } catch {
        if (!cancelled) setPhase("ready");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Passo 3: quando estiver “ready”, decida o que fazer
  useEffect(() => {
    if (phase !== "ready") return;

    if (!user) {
      // Não autenticado: mande para /login, preservando callbackUrl
      const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard";
      const callbackParam = encodeURIComponent(currentPath);
      router.replace(`/login?callbackUrl=${callbackParam}`);
    }
  }, [phase, user, router]);

  const renderLoadingState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando seu painel...</p>
      </div>
    </div>
  );

  if (phase !== "ready") {
    return (
      <SidebarProvider>
         <div className="flex min-h-screen w-full flex-col bg-background">
            <header className="sticky top-0 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
                 <Logo className="text-foreground" />
                 <div className="ml-auto flex items-center gap-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                 </div>
            </header>
            <main className="flex-1 flex items-center justify-center">
                 {renderLoadingState()}
            </main>
         </div>
      </SidebarProvider>
    );
  }

  if (!user) {
      // Enquanto o router faz o replace, renderiza um placeholder
      return (
         <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Redirecionando para login...</p>
            </div>
         </div>
      )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="p-2">
            <Logo className="text-sidebar-foreground" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(({ href, icon: Icon, label }) => (
               <SidebarMenuItem key={label}>
                <SidebarMenuButton asChild tooltip={label}>
                  <Link href={href}>
                    <Icon />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>{/* Footer content if any */}</SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="sm:hidden" />
          <div className="ml-auto flex items-center gap-4">
            <UserNav />
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0 pb-20 md:pb-4 flex flex-col">
          {children}
        </main>
      </SidebarInset>
      {isMobile && <BottomNavBar />}
    </SidebarProvider>
  );
}
