'use client';

import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projetos' },
  { href: '/materials', label: 'Materiais' },
  { href: '/hardware', label: 'Ferragens' },
  { href: '/cut-plan', label: 'Plano de Corte' },
  { href: '/budget', label: 'Orçamento' },
  { href: '/workspace', label: 'Projetista 3D' },
  { href: '/ai', label: 'IA Nexus Master' },
];

export function TopNav() {
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-4">
        {links.map((item) => (
          <Link key={item.href} className="rounded-md px-3 py-2 text-sm hover:bg-zinc-800" href={item.href}>
            {item.label}
          </Link>
        ))}
        <button
          className="ml-auto rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-zinc-950"
          onClick={() => {
            setToken(null);
            router.push('/');
          }}
        >
          Sair
        </button>
      </div>
    </header>
  );
}
