
"use client";

import { LoaderCircle } from 'lucide-react';

export default function RootPage() {
  // The UseAuthRouteGuard hook now handles all redirection logic.
  // This page just shows a loading spinner while the guard determines
  // where to send the user.
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
