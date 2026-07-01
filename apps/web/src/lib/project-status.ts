export const PROJECT_STATUSES = [
  'DRAFT',
  'APPROVED',
  'CUTTING',
  'EDGE_BANDING',
  'ASSEMBLY',
  'DELIVERED',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  DRAFT: 'Rascunho',
  APPROVED: 'Aprovado',
  CUTTING: 'Corte',
  EDGE_BANDING: 'Fita de Borda',
  ASSEMBLY: 'Montagem',
  DELIVERED: 'Entregue',
};

export const PROJECT_STATUS_BADGE: Record<ProjectStatus, string> = {
  DRAFT: 'bg-zinc-500/20 text-zinc-300',
  APPROVED: 'bg-sky-500/20 text-sky-300',
  CUTTING: 'bg-amber-500/20 text-amber-300',
  EDGE_BANDING: 'bg-fuchsia-500/20 text-fuchsia-300',
  ASSEMBLY: 'bg-violet-500/20 text-violet-300',
  DELIVERED: 'bg-emerald-500/20 text-emerald-300',
};

export const IN_PROGRESS_PROJECT_STATUSES: ProjectStatus[] = [
  'APPROVED',
  'CUTTING',
  'EDGE_BANDING',
  'ASSEMBLY',
];
