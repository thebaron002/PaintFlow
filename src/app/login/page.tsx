
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useUser } from '@/firebase';
import { handleSignInWithGoogle } from './actions';
import { LoaderCircle } from 'lucide-react';

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M21.99,12.22 C22,12.82 22,13.43 22,14 C22,18.98 18.5,22 12,22 C5.42,22 0,16.58 0,10 C0,3.42 5.42,0 12,0 C15.44,0 18.2,1.26 20.3,3.28 L17.7,5.82 C16.5,4.76 14.56,3.83 12,3.83 C8.16,3.83 5.03,6.96 5.03,10.8 C5.03,14.64 8.16,17.77 12,17.77 C15,17.77 16.9,16.54 17.84,15.62 C18.6,14.86 19.08,13.77 19.3,12.22 L12,12.22 L12,9.32 L21.99,9.32 Z" />
        </svg>
    )
}

export default function LoginPage() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        // If the user is already logged in, redirect them to the dashboard.
        if (!isUserLoading && user) {
            router.push('/dashboard');
        }
    }, [user, isUserLoading, router]);

    // Show a loading state while we check for an existing session.
    if (isUserLoading) {
        return (
             <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <Logo />
                    <p className="text-muted-foreground">
                      Loading...
                    </p>
                    <LoaderCircle className="h-6 w-6 animate-spin" />
                </div>
            </div>
        );
    }
  
  // Only render the login page if there's no user.
  return !user && (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
            <Logo />
            <h1 className="text-2xl font-semibold mt-4">Welcome</h1>
            <p className="text-muted-foreground">Sign in to manage your painting business.</p>
        </div>
        <div className="grid gap-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignInWithGoogle}
            >
              <GoogleIcon />
              Sign in with Google
            </Button>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground mt-6">
            By clicking continue, you agree to our{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
            </a>
            .
        </p>
      </div>
    </div>
  );
}
