'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { queryKeys, useMaterials, useProject } from '@/lib/hooks';
import { PROJECT_STATUS_BADGE, PROJECT_STATUS_LABEL } from '@/lib/project-status';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = String(params.id);
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const projectQuery = useProject(token, projectId);
  const materialsQuery = useMaterials(token);
  const project = projectQuery.data;
  const spaces = useMemo(() => project?.spaces ?? [], [project]);
  const units = useMemo(() => spaces.flatMap((space) => space.units.map((unit) => ({ ...unit, spaceId: space.id }))), [spaces]);
  const modules = useMemo(() => units.flatMap((unit) => unit.modules), [units]);
  const [spaceName, setSpaceName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitSpaceId, setUnitSpaceId] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [moduleUnitId, setModuleUnitId] = useState('');
  const [partName, setPartName] = useState('');
  const [partModuleId, setPartModuleId] = useState('');
  const [partMaterialId, setPartMaterialId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  function refresh() {
    queryClient.invalidateQueries({ queryKey: queryKeys.project(projectId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  }

  const createSpace = useMutation({
    mutationFn: () => apiFetch(`/projects/${projectId}/spaces`, { method: 'POST', body: JSON.stringify({ name: spaceName }) }, token ?? undefined),
    onSuccess: () => { setSpaceName(''); refresh(); },
  });

  const createUnit = useMutation({
    mutationFn: () => apiFetch(`/projects/${projectId}/units`, { method: 'POST', body: JSON.stringify({ spaceId: unitSpaceId, name: unitName, widthMm: 1200, heightMm: 720, depthMm: 560 }) }, token ?? undefined),
    onSuccess: () => { setUnitName(''); refresh(); },
  });

  const createModule = useMutation({
    mutationFn: () => apiFetch(`/units/${moduleUnitId}/modules`, { method: 'POST', body: JSON.stringify({ name: moduleName }) }, token ?? undefined),
    onSuccess: () => { setModuleName(''); refresh(); },
  });

  const createPart = useMutation({
    mutationFn: () => apiFetch(`/modules/${partModuleId}/parts`, { method: 'POST', body: JSON.stringify({ name: partName, materialId: partMaterialId || undefined, widthMm: 600, heightMm: 720, thicknessMm: 18, quantity: 1 }) }, token ?? undefined),
    onSuccess: () => { setPartName(''); setPartMaterialId(''); refresh(); },
  });

  const createTask = useMutation({
    mutationFn: () => apiFetch(`/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify({ title: taskTitle }) }, token ?? undefined),
    onSuccess: () => { setTaskTitle(''); refresh(); },
  });

  const createNote = useMutation({
    mutationFn: () => apiFetch(`/projects/${projectId}/notes`, { method: 'POST', body: JSON.stringify({ body: noteBody }) }, token ?? undefined),
    onSuccess: () => { setNoteBody(''); refresh(); },
  });

  const createAttachment = useMutation({
    mutationFn: () => apiFetch(`/projects/${projectId}/attachments`, { method: 'POST', body: JSON.stringify({ name: attachmentName, url: attachmentUrl, kind: 'DOCUMENT' }) }, token ?? undefined),
    onSuccess: () => { setAttachmentName(''); setAttachmentUrl(''); refresh(); },
  });

  if (!project) {
    return <AppShell><p className="text-sm text-zinc-400">Carregando projeto...</p></AppShell>;
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.code} · {project.name}</h1>
          <p className="mt-2 text-sm text-zinc-400">{project.customer.name} · {project.widthMm} × {project.heightMm} × {project.depthMm} mm</p>
        </div>
        <span className={`rounded-full px-3 py-2 text-sm font-medium ${PROJECT_STATUS_BADGE[project.status]}`}>{PROJECT_STATUS_LABEL[project.status]}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="space-y-4 xl:col-span-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-4 text-lg font-medium">Estrutura do projeto</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <form onSubmit={(e) => { e.preventDefault(); createSpace.mutate(); }} className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <input className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" value={spaceName} onChange={(e) => setSpaceName(e.target.value)} placeholder="Novo espaço" required />
                <button className="w-full rounded-lg bg-emerald-500 p-2 text-sm font-semibold text-zinc-950">Adicionar espaço</button>
              </form>
              <form onSubmit={(e) => { e.preventDefault(); createUnit.mutate(); }} className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <select className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" value={unitSpaceId} onChange={(e) => setUnitSpaceId(e.target.value)} required>
                  <option value="">Espaço</option>
                  {spaces.map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}
                </select>
                <input className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="Nova unidade" required />
                <button className="w-full rounded-lg bg-emerald-500 p-2 text-sm font-semibold text-zinc-950">Adicionar unidade</button>
              </form>
              <form onSubmit={(e) => { e.preventDefault(); createModule.mutate(); }} className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <select className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" value={moduleUnitId} onChange={(e) => setModuleUnitId(e.target.value)} required>
                  <option value="">Unidade</option>
                  {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                </select>
                <input className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" value={moduleName} onChange={(e) => setModuleName(e.target.value)} placeholder="Novo módulo" required />
                <button className="w-full rounded-lg bg-emerald-500 p-2 text-sm font-semibold text-zinc-950">Adicionar módulo</button>
              </form>
              <form onSubmit={(e) => { e.preventDefault(); createPart.mutate(); }} className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <select className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" value={partModuleId} onChange={(e) => setPartModuleId(e.target.value)} required>
                  <option value="">Módulo</option>
                  {modules.map((module) => <option key={module.id} value={module.id}>{module.name}</option>)}
                </select>
                <input className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="Nova peça" required />
                <select className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-2" value={partMaterialId} onChange={(e) => setPartMaterialId(e.target.value)}>
                  <option value="">Material</option>
                  {(materialsQuery.data ?? []).map((material) => <option key={material.id} value={material.id}>{material.name}</option>)}
                </select>
                <button className="w-full rounded-lg bg-emerald-500 p-2 text-sm font-semibold text-zinc-950">Adicionar peça</button>
              </form>
            </div>

            <div className="mt-6 space-y-4">
              {spaces.map((space) => (
                <article key={space.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  <h3 className="font-semibold">{space.name}</h3>
                  <div className="mt-3 space-y-3">
                    {space.units.map((unit) => (
                      <div key={unit.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                        <div className="font-medium">{unit.name}</div>
                        <div className="mt-2 space-y-2 text-sm text-zinc-400">
                          {unit.modules.map((module) => (
                            <div key={module.id}>
                              <div className="font-medium text-zinc-200">{module.name}</div>
                              <ul className="mt-1 list-disc pl-5">
                                {module.parts.map((part) => (
                                  <li key={part.id}>{part.name} · {part.material?.name ?? 'Sem material'} · {part.widthMm} × {part.heightMm} × {part.thicknessMm} mm</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-3 text-lg font-medium">Tarefas</h2>
            <form onSubmit={(e) => { e.preventDefault(); createTask.mutate(); }} className="mb-3 flex gap-2">
              <input className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Nova tarefa" required />
              <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950">+</button>
            </form>
            <div className="space-y-2 text-sm text-zinc-300">{project.tasks.map((task) => <div key={task.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">{task.title} · {task.status}</div>)}</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-3 text-lg font-medium">Notas</h2>
            <form onSubmit={(e) => { e.preventDefault(); createNote.mutate(); }} className="mb-3 space-y-2">
              <textarea className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Adicionar nota" rows={3} required />
              <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950">Salvar nota</button>
            </form>
            <div className="space-y-2 text-sm text-zinc-300">{project.projectNotes.map((note) => <div key={note.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">{note.body}</div>)}</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-3 text-lg font-medium">Anexos</h2>
            <form onSubmit={(e) => { e.preventDefault(); createAttachment.mutate(); }} className="mb-3 space-y-2">
              <input className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2" value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} placeholder="Nome do anexo" required />
              <input className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2" value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="URL do documento" required />
              <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950">Registrar anexo</button>
            </form>
            <div className="space-y-2 text-sm text-zinc-300">{project.attachments.map((attachment) => <div key={attachment.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">{attachment.name}</div>)}</div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="mb-3 text-lg font-medium">Histórico</h2>
            <div className="space-y-2 text-sm text-zinc-300">{project.history.map((entry) => <div key={entry.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">{PROJECT_STATUS_LABEL[entry.status]} · {entry.note || 'Sem observação'}</div>)}</div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
