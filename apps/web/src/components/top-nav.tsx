'use client';

import { apiFetch } from '@/lib/api';
import { queryKeys, useWorkspaces } from '@/lib/hooks';
import { SessionData } from '@/lib/types';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/projects', label: 'Projetos' },
  { href: '/customers', label: 'Clientes' },
  { href: '/kanban', label: 'Kanban' },
  { href: '/materials', label: 'Materiais' },
  { href: '/hardware', label: 'Ferragens' },
  { href: '/workspaces', label: 'Workspaces' },
  { href: '/cut-plan', label: 'Plano de Corte' },
  { href: '/budget', label: 'Orçamento' },
  { href: '/workspace', label: 'Projetista 3D' },
  { href: '/ai', label: 'IA Nexus Master' },
];

export function TopNav({ session }: { session: SessionData }) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const clear = useAuthStore((state) => state.clear);
  const queryClient = useQueryClient();
  const workspacesQuery = useWorkspaces(token);

  const switchWorkspace = useMutation({
    mutationFn: (workspaceId: string) =>
      apiFetch(`/workspaces/${workspaceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ setActive: true }),
      }, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.materials });
      queryClient.invalidateQueries({ queryKey: queryKeys.hardware });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflowStages });
      router.refresh();
    },
  });

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-6 py-4">
        {links.map((item) => (
          <Link key={item.href} className="rounded-md px-3 py-2 text-sm hover:bg-zinc-800" href={item.href}>
            {item.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <select
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={session.activeWorkspaceId ?? ''}
            onChange={(event) => switchWorkspace.mutate(event.target.value)}
          >
            {(workspacesQuery.data ?? []).map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
          <div className="text-right text-xs text-zinc-400">
            <div>{session.name}</div>
            <div>{session.activeWorkspace?.name ?? 'Sem workspace'}</div>
          </div>
          <button
            className="rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-zinc-950"
            onClick={() => {
              clear();
              router.push('/');
            }}
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
