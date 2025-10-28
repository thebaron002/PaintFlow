
'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Palette } from 'lucide-react';
import Link from 'next/link';
import {
  Briefcase,
  Calendar,
  LayoutDashboard,
  DollarSign,
  Landmark,
  Settings,
  Users,
  User as UserIcon,
  HardHat, // Ícone para a página de migração
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase';


const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/dashboard/calendar", icon: Calendar, label: "Calendar" },
  { href: "/dashboard/finance", icon: DollarSign, label: "Finance" },
  { href: "/dashboard/payroll", icon: Landmark, label: "Payroll" },
  { href: "/dashboard/crew", icon: Users, label: "Crew" },
  { href: "/dashboard/profile", icon: UserIcon, label: "Profile" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  { href: "/dashboard/styleguide", icon: Palette, label: "Styleguide" },
  { href: "/dashboard/migrate", icon: HardHat, label: "Migrate" },
];

const mobileNavItems = navItems.filter(item => 
    !["/dashboard/migrate", "/dashboard/profile", "/dashboard/settings", "/dashboard/styleguide"].includes(item.href)
);

const BottomNavBar = () => {
  const pathname = usePathname();
  const maxItems = 5;
  const navGridCols = `grid-cols-${mobileNavItems.length > maxItems ? maxItems : mobileNavItems.length}`;
  
  const navBgClass = 'bg-background/80 backdrop-blur-sm border-t';

  return (
    <div className={cn("md:hidden fixed bottom-0 left-0 z-50 w-full h-16", navBgClass)}>
      <div className={cn("grid h-full max-w-lg mx-auto font-medium", navGridCols)}>
        {mobileNavItems.slice(0, maxItems).map(({ href, icon: Icon, label }) => {
          const isCurrent = (pathname.startsWith(href) && href !== '/dashboard') || (pathname === href);
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-1 group text-center",
                isCurrent
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] leading-tight">{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  );
};


function DashboardGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
     <SidebarProvider>
      <Sidebar variant="floating" className="bg-white/40 backdrop-blur-sm">
        <SidebarHeader>
          <div className="p-2">
            <Logo />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = (href === '/dashboard' && pathname === href) || (href !== '/dashboard' && pathname.startsWith(href));
              return (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton asChild tooltip={label} isActive={isActive}>
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-transparent">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="sm:hidden" />
          <div className="ml-auto flex items-center gap-4">
              <UserNav />
          </div>
        </header>
        <main className={cn(
            "flex-1 flex flex-col p-4 sm:px-6 sm:py-0 pb-20 md:pb-4"
        )}>
          {children}
        </main>
      </SidebarInset>
      {isMobile && <BottomNavBar />}
    </SidebarProvider>
  );
}


export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <DashboardGuard>{children}</DashboardGuard>
    )
}
