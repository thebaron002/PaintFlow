
'use client';

import "./globals.css";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#F2F1EF',
};
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
        <meta name="theme-color" content="#7aa8c8" />
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
