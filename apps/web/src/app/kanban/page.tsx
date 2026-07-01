'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_BADGE,
  PROJECT_STATUS_LABEL,
  ProjectStatus,
} from '@/lib/project-status';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

type Project = {
  id: string;
  name: string;
  customer: string;
  status: ProjectStatus;
  widthMm: number;
  heightMm: number;
  depthMm: number;
};

type UpdateStatusPayload = {
  id: string;
  status: ProjectStatus;
};

export default function KanbanPage() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch<Project[]>('/projects', {}, token ?? undefined),
    enabled: !!token,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: UpdateStatusPayload) =>
      apiFetch<Project>(`/projects/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }, token ?? undefined),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] });
      const previous = queryClient.getQueryData<Project[]>(['projects']);
      queryClient.setQueryData<Project[]>(['projects'], (current = []) =>
        current.map((project) => (project.id === id ? { ...project, status } : project)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const groupedProjects = useMemo(() => {
    const initial = Object.fromEntries(PROJECT_STATUSES.map((status) => [status, [] as Project[]])) as Record<
      ProjectStatus,
      Project[]
    >;

    for (const project of projectsQuery.data ?? []) {
      initial[project.status]?.push(project);
    }

    return initial;
  }, [projectsQuery.data]);

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Kanban de Produção</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Arraste os cards entre etapas para atualizar o status salvo no banco de dados.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300">
          {projectsQuery.data?.length ?? 0} projetos monitorados
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-6">
        {PROJECT_STATUSES.map((status) => (
          <section
            key={status}
            className="min-h-[420px] rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!draggingId) return;
              const project = (projectsQuery.data ?? []).find((item) => item.id === draggingId);
              if (!project || project.status === status) return;
              updateStatusMutation.mutate({ id: project.id, status });
              setDraggingId(null);
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-medium">{PROJECT_STATUS_LABEL[status]}</h2>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${PROJECT_STATUS_BADGE[status]}`}>
                {groupedProjects[status].length}
              </span>
            </div>

            <div className="space-y-3">
              {groupedProjects[status].map((project) => (
                <article
                  key={project.id}
                  className="cursor-grab rounded-xl border border-zinc-800 bg-zinc-950 p-4 active:cursor-grabbing"
                  draggable
                  onDragStart={() => setDraggingId(project.id)}
                  onDragEnd={() => setDraggingId(null)}
                >
                  <p className="font-medium text-zinc-100">{project.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">{project.customer}</p>
                  <p className="mt-3 text-xs text-zinc-500">
                    {project.widthMm} × {project.heightMm} × {project.depthMm} mm
                  </p>
                </article>
              ))}

              {groupedProjects[status].length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-center text-sm text-zinc-500">
                  Solte um projeto aqui
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
