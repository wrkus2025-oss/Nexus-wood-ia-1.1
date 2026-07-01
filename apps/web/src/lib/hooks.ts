import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './api';
import {
  Customer,
  Hardware,
  HardwareCategory,
  Material,
  MaterialCategory,
  ProjectDetail,
  ProjectListItem,
  SessionData,
  WorkflowStage,
  WorkspaceSummary,
} from './types';

export const queryKeys = {
  session: ['session'] as const,
  workspaces: ['workspaces'] as const,
  customers: ['customers'] as const,
  projects: ['projects'] as const,
  materials: ['materials'] as const,
  materialCategories: ['material-categories'] as const,
  hardware: ['hardware'] as const,
  hardwareCategories: ['hardware-categories'] as const,
  workflowStages: ['workflow-stages'] as const,
  project: (id: string) => ['projects', id] as const,
};

export function useSession(token: string | null) {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: () => apiFetch<SessionData>('/auth/me', {}, token ?? undefined),
    enabled: !!token,
  });
}

export function useWorkspaces(token: string | null) {
  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: () => apiFetch<WorkspaceSummary[]>('/workspaces', {}, token ?? undefined),
    enabled: !!token,
  });
}

export function useCustomers(token: string | null) {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => apiFetch<Customer[]>('/customers', {}, token ?? undefined),
    enabled: !!token,
  });
}

export function useProjects(token: string | null) {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => apiFetch<ProjectListItem[]>('/projects', {}, token ?? undefined),
    enabled: !!token,
  });
}

export function useProject(token: string | null, id: string) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => apiFetch<ProjectDetail>(`/projects/${id}`, {}, token ?? undefined),
    enabled: !!token,
  });
}

export function useMaterials(token: string | null) {
  return useQuery({
    queryKey: queryKeys.materials,
    queryFn: () => apiFetch<Material[]>('/materials', {}, token ?? undefined),
    enabled: !!token,
  });
}

export function useMaterialCategories(token: string | null) {
  return useQuery({
    queryKey: queryKeys.materialCategories,
    queryFn: () => apiFetch<MaterialCategory[]>('/materials/categories', {}, token ?? undefined),
    enabled: !!token,
  });
}

export function useHardware(token: string | null) {
  return useQuery({
    queryKey: queryKeys.hardware,
    queryFn: () => apiFetch<Hardware[]>('/hardware', {}, token ?? undefined),
    enabled: !!token,
  });
}

export function useHardwareCategories(token: string | null) {
  return useQuery({
    queryKey: queryKeys.hardwareCategories,
    queryFn: () => apiFetch<HardwareCategory[]>('/hardware/categories', {}, token ?? undefined),
    enabled: !!token,
  });
}

export function useWorkflowStages(token: string | null) {
  return useQuery({
    queryKey: queryKeys.workflowStages,
    queryFn: () => apiFetch<WorkflowStage[]>('/workflow/stages', {}, token ?? undefined),
    enabled: !!token,
  });
}
