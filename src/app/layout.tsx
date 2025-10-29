
'use client';

import "./globals.css";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { FirebaseClientProvider } from "@/firebase";
import { UseAuthRouteGuard } from "@/hooks/useAuthRouteGuard";
import { Suspense } from 'react';

function RootLayoutContent({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <UseAuthRouteGuard />
      </Suspense>
      {children}
    </>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={cn("app-bg min-h-dvh antialiased text-zinc-900")}>
        <AuthProvider>
          <FirebaseClientProvider>
            <RootLayoutContent>{children}</RootLayoutContent>
          </FirebaseClientProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
