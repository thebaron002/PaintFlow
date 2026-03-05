
'use client';
import { ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useUser } from '@/firebase';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
