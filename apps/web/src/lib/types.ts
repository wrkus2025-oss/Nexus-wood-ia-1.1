import { AttachmentKind, PartType, ProjectStatus, Role, TaskStatus } from './enums';

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
};

export type SessionData = {
  id: string;
  email: string;
  name: string;
  role: Role;
  activeWorkspaceId: string | null;
  activeWorkspace: WorkspaceSummary | null;
  memberships: Array<{
    id: string;
    role: Role;
    workspaceId: string;
    workspace: WorkspaceSummary;
  }>;
};

export type CustomerContact = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isPrimary: boolean;
};

export type Address = {
  id: string;
  label?: string | null;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
};

export type Customer = {
  id: string;
  name: string;
  companyName?: string | null;
  documentNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  contacts: CustomerContact[];
  addresses: Address[];
  projects?: Array<{ id: string; name: string; code: string; status: ProjectStatus; updatedAt: string }>;
  _count?: { projects: number };
};

export type MaterialCategory = {
  id: string;
  name: string;
  description?: string | null;
};

export type HardwareCategory = {
  id: string;
  name: string;
  description?: string | null;
};

export type Material = {
  id: string;
  name: string;
  manufacturer: string;
  group?: string | null;
  sku?: string | null;
  color: string;
  grainDirection: string;
  finish?: string | null;
  thicknessMm: number;
  sheetWidthMm?: number | null;
  sheetHeightMm?: number | null;
  weightKgM2: number;
  pricePerSheet: number;
  category?: MaterialCategory | null;
};

export type Hardware = {
  id: string;
  type: string;
  name: string;
  manufacturer: string;
  code: string;
  measures: string;
  finish?: string | null;
  description?: string | null;
  unitCost: number;
  category?: HardwareCategory | null;
};

export type PartHardwareItem = {
  id: string;
  quantity: number;
  notes?: string | null;
  hardware: Hardware;
};

export type Part = {
  id: string;
  name: string;
  code: string;
  type: PartType;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  quantity: number;
  finish?: string | null;
  notes?: string | null;
  material?: Material | null;
  hardwareItems: PartHardwareItem[];
};

export type UnitModule = {
  id: string;
  name: string;
  code: string;
  notes?: string | null;
  parts: Part[];
};

export type ProjectUnit = {
  id: string;
  name: string;
  code: string;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  notes?: string | null;
  spaceId?: string;
  modules: UnitModule[];
};

export type ProjectSpace = {
  id: string;
  name: string;
  code: string;
  notes?: string | null;
  widthMm?: number | null;
  heightMm?: number | null;
  depthMm?: number | null;
  units: ProjectUnit[];
};

export type WorkflowStage = {
  id: string;
  key: ProjectStatus;
  label: string;
  orderIndex: number;
  color?: string | null;
};

export type ProjectHistoryEntry = {
  id: string;
  status: ProjectStatus;
  note?: string | null;
  createdAt: string;
  stage?: WorkflowStage | null;
  changedBy: { id: string; name: string; email: string };
};

export type ProductionTask = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  assignedTo?: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
};

export type Attachment = {
  id: string;
  name: string;
  kind: AttachmentKind;
  url: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
};

export type ProjectNote = {
  id: string;
  body: string;
  createdAt: string;
  createdBy: { id: string; name: string; email: string };
};

export type AuditEvent = {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: { id: string; name: string; email: string } | null;
};

export type ProjectListItem = {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  dueDate?: string | null;
  quotedValue?: number | null;
  customer: Customer;
  _count?: { spaces: number; tasks: number };
};

export type ProjectDetail = ProjectListItem & {
  description?: string | null;
  notes?: string | null;
  spaces: ProjectSpace[];
  history: ProjectHistoryEntry[];
  tasks: ProductionTask[];
  attachments: Attachment[];
  projectNotes: ProjectNote[];
  auditEvents: AuditEvent[];
};
