'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { PropsWithChildren, useEffect } from 'react';
import { TopNav } from './top-nav';

export function AppShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!token) {
      router.push('/');
    }
  }, [router, token]);

  if (!token) {
    return null;
  }

  return (
    <div>
      <TopNav />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
