
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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#F2F1EF" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={cn("app-bg min-h-dvh antialiased text-zinc-900")} suppressHydrationWarning>
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
