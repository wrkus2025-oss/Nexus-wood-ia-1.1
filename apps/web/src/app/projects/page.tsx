'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { queryKeys, useCustomers, useProjects } from '@/lib/hooks';
import { PROJECT_STATUS_BADGE, PROJECT_STATUS_LABEL } from '@/lib/project-status';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function ProjectsPage() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const projectsQuery = useProjects(token);
  const customersQuery = useCustomers(token);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [widthMm, setWidthMm] = useState(3000);
  const [heightMm, setHeightMm] = useState(2700);
  const [depthMm, setDepthMm] = useState(600);
  const [quotedValue, setQuotedValue] = useState(0);
  const [dueDate, setDueDate] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/projects', {
        method: 'POST',
        body: JSON.stringify({
          name,
          code: code || undefined,
          customerId,
          widthMm,
          heightMm,
          depthMm,
          quotedValue,
          dueDate: dueDate || undefined,
        }),
      }, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      setName('');
      setCode('');
      setCustomerId('');
      setQuotedValue(0);
      setDueDate('');
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Projetos</h1>
      <form onSubmit={onSubmit} className="mb-6 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5 md:grid-cols-4">
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do projeto" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código" />
        <select className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
          <option value="">Selecione o cliente</option>
          {(customersQuery.data ?? []).map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" type="number" value={widthMm} onChange={(e) => setWidthMm(Number(e.target.value))} placeholder="Largura" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" type="number" value={heightMm} onChange={(e) => setHeightMm(Number(e.target.value))} placeholder="Altura" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" type="number" value={depthMm} onChange={(e) => setDepthMm(Number(e.target.value))} placeholder="Profundidade" required />
        <input className="rounded-lg border border-zinc-700 bg-zinc-950 p-3" type="number" value={quotedValue} onChange={(e) => setQuotedValue(Number(e.target.value))} placeholder="Valor" />
        <button className="rounded-lg bg-emerald-500 p-3 font-semibold text-zinc-950 md:col-span-4" type="submit">Criar projeto</button>
      </form>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Projeto</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Estrutura</th>
            </tr>
          </thead>
          <tbody>
            {projectsQuery.data?.map((project) => (
              <tr key={project.id} className="border-t border-zinc-800">
                <td className="px-4 py-3"><Link className="underline-offset-4 hover:underline" href={`/projects/${project.id}`}>{project.code} · {project.name}</Link></td>
                <td className="px-4 py-3">{project.customer.name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${PROJECT_STATUS_BADGE[project.status]}`}>
                    {PROJECT_STATUS_LABEL[project.status]}
                  </span>
                </td>
                <td className="px-4 py-3">{project._count?.spaces ?? 0} espaços / {project._count?.tasks ?? 0} tarefas</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
