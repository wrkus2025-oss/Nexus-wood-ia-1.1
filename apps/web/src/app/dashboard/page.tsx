'use client';

import { AppShell } from '@/components/app-shell';
import { useHardware, useMaterials, useProjects } from '@/lib/hooks';
import { IN_PROGRESS_PROJECT_STATUSES, PROJECT_STATUS_BADGE, PROJECT_STATUS_LABEL } from '@/lib/project-status';
import { useAuthStore } from '@/store/auth';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const projectsQ = useProjects(token);
  const materialsQ = useMaterials(token);
  const hardwareQ = useHardware(token);

  const projects = projectsQ.data ?? [];
  const materials = materialsQ.data ?? [];
  const hardware = hardwareQ.data ?? [];

  const inProgress = projects.filter((project) => IN_PROGRESS_PROJECT_STATUSES.includes(project.status)).length;
  const completed = projects.filter((project) => project.status === 'DELIVERED').length;
  const avgSheetCost = materials.length
    ? (materials.reduce((sum, material) => sum + material.pricePerSheet, 0) / materials.length).toFixed(2)
    : '0.00';
  const avgHwCost = hardware.length
    ? (hardware.reduce((sum, item) => sum + item.unitCost, 0) / hardware.length).toFixed(2)
    : '0.00';

  const cards = [
    { title: 'Projetos em Andamento', value: String(inProgress) },
    { title: 'Projetos Concluídos', value: String(completed) },
    { title: 'Total de Projetos', value: String(projects.length) },
    { title: 'Clientes Ativos', value: String(new Set(projects.map((project) => project.customer.id)).size) },
    { title: 'Materiais Cadastrados', value: String(materials.length) },
    { title: 'Ferragens Cadastradas', value: String(hardware.length) },
    { title: 'Custo Médio / Chapa', value: `R$ ${avgSheetCost}` },
    { title: 'Custo Médio / Ferragem', value: `R$ ${avgHwCost}` },
  ];

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
          <p className="text-sm text-zinc-500">Nenhum projeto encontrado.</p>
        ) : (
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
                {projects.slice(0, 8).map((project) => (
                  <tr key={project.id} className="border-t border-zinc-800">
                    <td className="px-4 py-3">{project.code} · {project.name}</td>
                    <td className="px-4 py-3">{project.customer.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROJECT_STATUS_BADGE[project.status]}`}>
                        {PROJECT_STATUS_LABEL[project.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">{project._count?.spaces ?? 0} espaços / {project._count?.tasks ?? 0} tarefas</td>
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
