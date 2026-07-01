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
  engineeringReport: {
    shelfSagMm: number;
    shelfSagLimitMm: number;
    tabletopThicknessMm: number;
    hingeQuantityPerDoor: number;
    hingePlacementsMm: number[];
    drawerSlideClearanceMm: number;
    doorClearanceMm: number;
    rigidityScore: number;
    rigidityClassification: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  recommendedMaterials: {
    carcass: string;
    shelves: string;
    doors: string;
    drawers: string;
    backPanel: string;
  };
  cutList: Array<{
    name: string;
    type: string;
    widthMm: number;
    heightMm: number;
    thicknessMm: number;
    quantity: number;
    edgeBanding: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
    grainDirection: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  }>;
  hardwareList: Array<{
    type: string;
    name: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    notes: string;
  }>;
  budget: {
    boardConsumption: {
      totalAreaM2: number;
      totalSheets: number;
      sheetWidthMm: number;
      sheetHeightMm: number;
      utilizationPercent: number;
    };
    edgeBandingMeters: number;
    materialCost: number;
    edgeBandingCost: number;
    hardwareCost: number;
    laborCost: number;
    installationCost: number;
    transportCost: number;
    marginPercent: number;
    subtotal: number;
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
  const [prompt, setPrompt] = useState('Kitchen cabinet 2400x2200x600 with 4 doors and 3 drawers');
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
        <div className="mt-6 space-y-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
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
              <p className="text-xs text-zinc-400">Consumo de chapas</p>
              <p className="mt-2 text-lg font-semibold">{response.budget.boardConsumption.totalSheets}</p>
            </article>
            <article className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
              <p className="text-xs text-zinc-400">Produção estimada</p>
              <p className="mt-2 text-lg font-semibold">{response.productionEstimateHours}h</p>
            </article>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-200">Relatório de engenharia</h3>
            <ul className="space-y-1 text-sm text-zinc-300">
              <li>Flecha prateleira: {response.engineeringReport.shelfSagMm.toFixed(2)}mm / limite {response.engineeringReport.shelfSagLimitMm.toFixed(2)}mm</li>
              <li>Espessura do tampo: {response.engineeringReport.tabletopThicknessMm}mm</li>
              <li>Dobradiças por porta: {response.engineeringReport.hingeQuantityPerDoor}</li>
              <li>Posições dobradiça (mm): {response.engineeringReport.hingePlacementsMm.join(', ')}</li>
              <li>Folga corrediça: {response.engineeringReport.drawerSlideClearanceMm}mm</li>
              <li>Folga porta: {response.engineeringReport.doorClearanceMm}mm</li>
              <li>Rigidez: {response.engineeringReport.rigidityScore}/100 ({response.engineeringReport.rigidityClassification})</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-200">Materiais recomendados</h3>
            <ul className="grid gap-1 text-sm text-zinc-300 sm:grid-cols-2">
              <li>Estrutura: {response.recommendedMaterials.carcass}</li>
              <li>Prateleiras: {response.recommendedMaterials.shelves}</li>
              <li>Portas: {response.recommendedMaterials.doors}</li>
              <li>Gavetas: {response.recommendedMaterials.drawers}</li>
              <li>Fundo: {response.recommendedMaterials.backPanel}</li>
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-200">Lista de ferragens</h3>
            <div className="space-y-1 text-sm text-zinc-300">
              {response.hardwareList.map((item, index) => (
                <p key={`${item.name}-${index}`}>
                  {item.name} · qtd {item.quantity} · {formatCurrency(item.totalCost)}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-200">Lista de corte</h3>
            <div className="max-h-64 overflow-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950">
                  <tr>
                    <th className="px-2 py-2">Peça</th>
                    <th className="px-2 py-2">Medidas</th>
                    <th className="px-2 py-2">Qtd</th>
                    <th className="px-2 py-2">Fita</th>
                    <th className="px-2 py-2">Veio</th>
                  </tr>
                </thead>
                <tbody>
                  {response.cutList.map((part, index) => (
                    <tr key={`${part.name}-${index}`} className="border-t border-zinc-800">
                      <td className="px-2 py-2">{part.name}</td>
                      <td className="px-2 py-2">{part.widthMm}×{part.heightMm}×{part.thicknessMm}</td>
                      <td className="px-2 py-2">{part.quantity}</td>
                      <td className="px-2 py-2">T:{part.edgeBanding.top} R:{part.edgeBanding.right} B:{part.edgeBanding.bottom} L:{part.edgeBanding.left}</td>
                      <td className="px-2 py-2">{part.grainDirection}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
