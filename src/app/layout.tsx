
'use client';

import "./globals.css";
import { cn } from "@/lib/utils";
import { ReactNode, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { FirebaseClientProvider } from "@/firebase";
import { usePathname, useRouter } from "next/navigation";

function RootRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/') {
      router.replace('/dashboard');
    }
  }, [pathname, router]);

  return null;
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={cn("app-bg min-h-dvh antialiased text-zinc-900")}>
        <AuthProvider>
          <FirebaseClientProvider>
            <RootRedirect />
            {children}
          </FirebaseClientProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
