
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth]);

  useEffect(() => {
    if (auth?.currentUser) {
      router.push('/dashboard');
    }
  }, [auth?.currentUser, router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
       <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Logo />
          <p className="text-muted-foreground">Loading your dashboard...</p>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <Skeleton className="h-4 w-4 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <Skeleton className="h-4 w-4 rounded-full animate-bounce" />
          </div>
        </div>
    </div>
  );
}
