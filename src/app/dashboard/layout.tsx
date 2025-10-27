// src/app/dashboard/layout.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
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
import { useAuthBootstrap } from "@/firebase/use-auth-bootstrap";

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
  const pathname = usePathname();
  const { initializing, user } = useAuthBootstrap();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Don't redirect until the auth state is fully determined.
    if (initializing) {
      return;
    }

    if (!user) {
      // User is not logged in, redirect to login page.
      // Preserve the current path to redirect back after login.
      const callbackParam = encodeURIComponent(pathname);
      router.replace(`/login?callbackUrl=${callbackParam}`);
    }
  }, [initializing, user, router, pathname]);

  if (initializing) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If there's no user, the useEffect will handle the redirect.
  // Render null to prevent a flash of the dashboard.
  if (!user) {
      return null;
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
