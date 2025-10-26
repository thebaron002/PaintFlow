
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is now a simple redirector.
// The main dashboard layout handles all authentication checks.
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to the dashboard. The dashboard layout will
    // then decide if the user needs to be sent to the login page.
    router.push('/dashboard');
  }, [router]);

  // Return null or a loading spinner, as the user will be redirected immediately.
  return null;
}
