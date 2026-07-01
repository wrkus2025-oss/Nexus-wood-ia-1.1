'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

type Project = { id: string; status: string };
type Material = { id: string; pricePerSheet: number };
type Hardware = { id: string; unitCost: number };

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);

  const projectsQ = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch<Project[]>('/projects', {}, token ?? undefined),
    enabled: !!token,
  });

  const materialsQ = useQuery({
    queryKey: ['materials'],
    queryFn: () => apiFetch<Material[]>('/materials', {}, token ?? undefined),
    enabled: !!token,
  });

  const hardwareQ = useQuery({
    queryKey: ['hardware'],
    queryFn: () => apiFetch<Hardware[]>('/hardware', {}, token ?? undefined),
    enabled: !!token,
  });

  const projects = projectsQ.data ?? [];
  const materials = materialsQ.data ?? [];
  const hardware = hardwareQ.data ?? [];

  const inProgress = projects.filter((p) => ['PENDING', 'PRODUCTION', 'ASSEMBLY'].includes(p.status)).length;
  const completed = projects.filter((p) => p.status === 'COMPLETED').length;
  const avgSheetCost = materials.length
    ? (materials.reduce((s, m) => s + m.pricePerSheet, 0) / materials.length).toFixed(2)
    : '0.00';
  const avgHwCost = hardware.length
    ? (hardware.reduce((s, h) => s + h.unitCost, 0) / hardware.length).toFixed(2)
    : '0.00';

  const cards = [
    { title: 'Projetos em Andamento', value: String(inProgress) },
    { title: 'Projetos Concluídos', value: String(completed) },
    { title: 'Total de Projetos', value: String(projects.length) },
    { title: 'Materiais Cadastrados', value: String(materials.length) },
    { title: 'Ferragens Cadastradas', value: String(hardware.length) },
    { title: 'Custo Médio / Chapa', value: `R$ ${avgSheetCost}` },
    { title: 'Custo Médio / Ferragem', value: `R$ ${avgHwCost}` },
    { title: 'Aproveitamento Estimado', value: '92%' },
  ];

  const statusBadge: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-300',
    PRODUCTION: 'bg-blue-500/20 text-blue-300',
    ASSEMBLY: 'bg-purple-500/20 text-purple-300',
    INSTALLATION: 'bg-orange-500/20 text-orange-300',
    COMPLETED: 'bg-emerald-500/20 text-emerald-300',
  };

  const statusLabel: Record<string, string> = {
    PENDING: 'Pendente',
    PRODUCTION: 'Produção',
    ASSEMBLY: 'Montagem',
    INSTALLATION: 'Instalação',
    COMPLETED: 'Concluído',
  };

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
          >
            <p className="text-xs text-zinc-400">{card.title}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </motion.article>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Projetos Recentes</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum projeto encontrado. Crie um em &quot;Projetos&quot;.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="px-4 py-3">Projeto</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 8).map((p) => (
                  <tr key={p.id} className="border-t border-zinc-800">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{p.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[p.status] ?? ''}`}>
                        {statusLabel[p.status] ?? p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
