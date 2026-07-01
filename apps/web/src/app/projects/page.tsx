'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

type Project = {
  id: string;
  name: string;
  customer: string;
  status: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
};

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const [name, setName] = useState('');
  const [customer, setCustomer] = useState('');
  const [widthMm, setWidthMm] = useState(3000);
  const [heightMm, setHeightMm] = useState(2700);
  const [depthMm, setDepthMm] = useState(600);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch<Project[]>('/projects', {}, token ?? undefined),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name,
          customer,
          widthMm,
          heightMm,
          depthMm,
        }),
      }, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setName('');
      setCustomer('');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Projetos</h1>
      <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 md:grid-cols-5">
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do projeto" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Cliente" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" type="number" value={widthMm} onChange={(e) => setWidthMm(Number(e.target.value))} placeholder="Largura" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" type="number" value={heightMm} onChange={(e) => setHeightMm(Number(e.target.value))} placeholder="Altura" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" type="number" value={depthMm} onChange={(e) => setDepthMm(Number(e.target.value))} placeholder="Profundidade" required />
        <button className="rounded-lg bg-emerald-500 p-3 font-semibold text-zinc-950 md:col-span-5" type="submit">Criar Projeto</button>
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Projeto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Dimensões</th>
            </tr>
          </thead>
          <tbody>
            {projectsQuery.data?.map((project) => (
              <tr key={project.id} className="border-t border-zinc-800">
                <td className="px-4 py-3">{project.name}</td>
                <td className="px-4 py-3">{project.customer}</td>
                <td className="px-4 py-3">{project.status}</td>
                <td className="px-4 py-3">{project.widthMm} x {project.heightMm} x {project.depthMm} mm</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
