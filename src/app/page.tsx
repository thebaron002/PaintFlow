"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { LoaderCircle } from 'lucide-react';
import { Logo } from '@/components/logo';

// This page now acts as a loading gate.
export default function RootPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    // Only redirect when we are sure about the user's auth state.
    if (!isUserLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router]);

  // Return a full-page loading indicator while we determine the auth state.
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Logo />
            <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
    </div>
  );
}
