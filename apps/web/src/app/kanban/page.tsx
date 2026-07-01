'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { queryKeys, useProjects } from '@/lib/hooks';
import { PROJECT_STATUSES, PROJECT_STATUS_BADGE, PROJECT_STATUS_LABEL, ProjectStatus } from '@/lib/project-status';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

export default function KanbanPage() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const projectsQuery = useProjects(token);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) =>
      apiFetch(`/projects/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token ?? undefined),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });

  const groupedProjects = useMemo(() => {
    const projects = projectsQuery.data ?? [];
    const initial = Object.fromEntries(PROJECT_STATUSES.map((status) => [status, [] as typeof projects])) as Record<ProjectStatus, typeof projects>;
    for (const project of projects) {
      (initial[project.status] ??= []).push(project);
    }
    return initial;
  }, [projectsQuery.data]);

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kanban de Produção</h1>
          <p className="mt-2 text-sm text-zinc-400">Arraste os cards entre etapas para atualizar o workflow do projeto.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">{projectsQuery.data?.length ?? 0} projetos monitorados</div>
      </div>

      <div className="grid gap-4 xl:grid-cols-6">
        {PROJECT_STATUSES.map((status) => (
          <section
            key={status}
            className="min-h-[420px] rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!draggingId) return;
              updateStatusMutation.mutate({ id: draggingId, status });
              setDraggingId(null);
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-medium">{PROJECT_STATUS_LABEL[status]}</h2>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${PROJECT_STATUS_BADGE[status]}`}>{groupedProjects[status]?.length ?? 0}</span>
            </div>
            <div className="space-y-3">
              {(groupedProjects[status] ?? []).map((project) => (
                <article key={project.id} className="cursor-grab rounded-xl border border-zinc-800 bg-zinc-950 p-4 active:cursor-grabbing" draggable onDragStart={() => setDraggingId(project.id)} onDragEnd={() => setDraggingId(null)}>
                  <p className="font-medium text-zinc-100">{project.code} · {project.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">{project.customer.name}</p>
                  <p className="mt-3 text-xs text-zinc-500">{project.widthMm} × {project.heightMm} × {project.depthMm} mm</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
