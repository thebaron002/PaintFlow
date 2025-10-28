import "./globals.css";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import { FirebaseClientProvider } from "@/firebase";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={cn("app-bg min-h-dvh antialiased text-zinc-900")}>
        <AuthProvider>
          <FirebaseClientProvider>
            <div className="container max-w-7xl py-8">{children}</div>
          </FirebaseClientProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
