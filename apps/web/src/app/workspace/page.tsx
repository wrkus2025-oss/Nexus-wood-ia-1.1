'use client';

import { AppShell } from '@/components/app-shell';
import { ThreeWorkspace } from '@/components/three-workspace';

export default function WorkspacePage() {
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Projetista 3D Profissional</h1>
      <p className="mb-4 text-sm text-zinc-400">
        Navegação por órbita, pan e zoom habilitada com ambiente técnico para modelagem paramétrica.
      </p>
      <ThreeWorkspace />
    </AppShell>
  );
}
