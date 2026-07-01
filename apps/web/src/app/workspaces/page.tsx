'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { queryKeys, useSession, useWorkspaces } from '@/lib/hooks';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

export default function WorkspacesPage() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const sessionQuery = useSession(token);
  const workspacesQuery = useWorkspaces(token);
  const activeWorkspaceId = sessionQuery.data?.activeWorkspaceId ?? '';
  const membersQuery = useQuery({
    queryKey: ['workspace-members', activeWorkspaceId],
    queryFn: () => apiFetch(`/workspaces/${activeWorkspaceId}/members`, {}, token ?? undefined),
    enabled: !!token && !!activeWorkspaceId,
  });
  const [workspaceName, setWorkspaceName] = useState('');
  const [description, setDescription] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('DESIGNER');

  const createWorkspace = useMutation({
    mutationFn: () => apiFetch('/workspaces', { method: 'POST', body: JSON.stringify({ name: workspaceName, description }) }, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session });
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
      setWorkspaceName('');
      setDescription('');
    },
  });

  const addMember = useMutation({
    mutationFn: () => apiFetch(`/workspaces/${activeWorkspaceId}/members`, { method: 'POST', body: JSON.stringify({ email: memberEmail, role: memberRole }) }, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', activeWorkspaceId] });
      setMemberEmail('');
      setMemberRole('DESIGNER');
    },
  });

  function submitWorkspace(event: FormEvent) {
    event.preventDefault();
    createWorkspace.mutate();
  }

  function submitMember(event: FormEvent) {
    event.preventDefault();
    addMember.mutate();
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Workspaces</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-lg font-medium">Novo workspace</h2>
          <form onSubmit={submitWorkspace} className="space-y-3">
            <input className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} placeholder="Nome do workspace" required />
            <textarea className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" rows={4} />
            <button className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-zinc-950" type="submit">Criar workspace</button>
          </form>
          <div className="mt-6 space-y-2">
            {(workspacesQuery.data ?? []).map((workspace) => (
              <div key={workspace.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm">
                <div className="font-medium">{workspace.name}</div>
                <div className="text-zinc-400">{workspace.role} · {workspace.slug}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-lg font-medium">Membros do workspace ativo</h2>
          <form onSubmit={submitMember} className="mb-4 grid gap-3 md:grid-cols-3">
            <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 md:col-span-2" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} placeholder="Email do membro" required />
            <select className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
              <option value="ADMIN">ADMIN</option>
              <option value="DESIGNER">DESIGNER</option>
              <option value="PRODUCTION">PRODUCTION</option>
              <option value="SALES">SALES</option>
            </select>
            <button className="rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 md:col-span-3" type="submit">Adicionar membro</button>
          </form>
          <div className="space-y-2">
            {(membersQuery.data as Array<{ id: string; role: string; user: { name: string; email: string } }> | undefined)?.map((member) => (
              <div key={member.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm">
                <div className="font-medium">{member.user.name}</div>
                <div className="text-zinc-400">{member.user.email} · {member.role}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
