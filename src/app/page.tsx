
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Logo } from '@/components/logo';
import { Skeleton } from '@/components/ui/skeleton';

export default function RootPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
       <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Logo />
          <p className="text-muted-foreground">Loading your experience...</p>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <Skeleton className="h-4 w-4 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <Skeleton className="h-4 w-4 rounded-full animate-bounce" />
          </div>
        </div>
    </div>
  );
}

    