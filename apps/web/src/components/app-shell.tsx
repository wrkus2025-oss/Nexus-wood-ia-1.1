'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { PropsWithChildren, useEffect } from 'react';
import { useSession } from '@/lib/hooks';
import { TopNav } from './top-nav';

export function AppShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const clear = useAuthStore((state) => state.clear);
  const sessionQuery = useSession(token);

  useEffect(() => {
    if (!token) {
      router.push('/');
    }
  }, [router, token]);

  useEffect(() => {
    if (sessionQuery.isError) {
      clear();
      router.push('/');
    }
  }, [clear, router, sessionQuery.isError]);

  if (!token || sessionQuery.isLoading) {
    return <main className="mx-auto max-w-7xl px-6 py-8 text-sm text-zinc-400">Carregando workspace...</main>;
  }

  if (!sessionQuery.data) {
    return null;
  }

  return (
    <div>
      <TopNav session={sessionQuery.data} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
