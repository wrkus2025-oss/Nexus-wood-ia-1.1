'use client';

import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type AiTextResponse = {
  kind: 'TEXT';
  reason: 'MISSING_INFO' | 'ERROR' | 'EXPLANATION';
  message: string;
};

type AiProjectResponse = {
  kind: 'PROJECT';
  projectId: string;
  workspaceId: string;
  projectName: string;
  technicalSummary: {
    widthMm: number;
    heightMm: number;
    depthMm: number;
    doorCount: number;
    drawerCount: number;
    panelThicknessMm: number;
  };
  engineeringDecisions: Array<{
    code: string;
    title: string;
    detail: string;
  }>;
  budget: {
    materialCost: number;
    hardwareCost: number;
    laborCost: number;
    installationCost: number;
    transportCost: number;
    marginPercent: number;
    finalPrice: number;
  };
  cutPlan: {
    totalParts: number;
    totalSheets: number;
    utilizationPercent: number;
    wastePercent: number;
    suggestedSheetWidthMm: number;
    suggestedSheetHeightMm: number;
  };
  productionEstimateHours: number;
};

type AiAssistResponse = AiTextResponse | AiProjectResponse;

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AiPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [prompt, setPrompt] = useState('Crie uma cozinha em L de 4m por 3m com torre quente e ilha central.');
  const [response, setResponse] = useState<AiAssistResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await apiFetch<AiAssistResponse>(
        '/ai/assist',
        {
          method: 'POST',
          body: JSON.stringify({ prompt }),
        },
        token ?? undefined,
      );
      setResponse(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">IA Nexus Master</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <textarea
          className="h-40 w-full rounded-xl border border-zinc-700 bg-zinc-900 p-4"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-950" disabled={loading}>
          {loading ? 'Gerando...' : 'Executar'}
        </button>
      </form>
      {response?.kind === 'TEXT' ? (
        <pre className="mt-6 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900 p-5">{response.message}</pre>
      ) : null}
      {response?.kind === 'PROJECT' ? (
        <div className="mt-6 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{response.projectName}</h2>
            <button
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
              onClick={() => router.push(`/workspace?projectId=${response.projectId}`)}
              type="button"
            >
              Abrir projeto 3D
            </button>
          </div>
          <p className="text-sm text-zinc-300">
            Dimensões: {response.technicalSummary.widthMm} × {response.technicalSummary.heightMm} × {response.technicalSummary.depthMm} mm ·
            Portas: {response.technicalSummary.doorCount} · Gavetas: {response.technicalSummary.drawerCount}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <p className="text-xs text-zinc-400">Orçamento final</p>
              <p className="mt-2 text-lg font-semibold text-emerald-300">{formatCurrency(response.budget.finalPrice)}</p>
            </article>
            <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <p className="text-xs text-zinc-400">Chapas sugeridas</p>
              <p className="mt-2 text-lg font-semibold">{response.cutPlan.totalSheets}</p>
            </article>
            <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <p className="text-xs text-zinc-400">Produção estimada</p>
              <p className="mt-2 text-lg font-semibold">{response.productionEstimateHours}h</p>
            </article>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-200">Decisões de engenharia</h3>
            <ul className="space-y-1 text-sm text-zinc-300">
              {response.engineeringDecisions.map((item) => (
                <li key={item.code}>• {item.title}: {item.detail}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-800" href={`/budget?projectId=${response.projectId}`}>
              Ver orçamento
            </Link>
            <Link className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-800" href={`/cut-plan?projectId=${response.projectId}`}>
              Ver plano de corte
            </Link>
            <Link className="rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-800" href={`/projects/${response.projectId}`}>
              Ver estrutura técnica
            </Link>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
